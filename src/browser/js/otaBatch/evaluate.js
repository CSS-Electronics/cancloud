// Pure evaluation pipeline for the OTA batch manager. No S3/history imports -
// unit-testable. Reuses the single-device building blocks verbatim so fleet
// and single-device behavior cannot diverge:
// - merge semantics = PartialConfigLoader / EncryptionModal (deepmerge,
//   arrays overwritten)
// - schema validation = the ajv recipe compiled in cache.js
// - config warnings = editorActions.collectConfigurationWarnings
// - encryption analysis/guards = config-editor-tools encryptionFields

import { editorActions } from "config-editor-base";
import { encryptionFields, migration } from "config-editor-tools";
import { SUPPORTED_REVISIONS, STALE_HEARTBEAT_MS } from "./constants";
import { classifyCurrentEncryption } from "../encryptionLock";

export { classifyCurrentEncryption };

import merge from "deepmerge";

const overwriteMerge = (destinationArray, sourceArray) => sourceArray;

export const mergeConfig = (config, partial) =>
  merge(config, partial, { arrayMerge: overwriteMerge });

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const getPath = (obj, path) => {
  let node = obj;
  for (let i = 0; i < path.length; i++) {
    if (!isPlainObject(node)) return undefined;
    node = node[path[i]];
  }
  return node;
};

const hasPath = (obj, path) => {
  let node = obj;
  for (let i = 0; i < path.length; i++) {
    if (!isPlainObject(node) || !(path[i] in node)) return false;
    node = node[path[i]];
  }
  return true;
};

// The five credential sections - same map as analyzeConfigEncryption
// (config-editor-tools encryptionFields.js), verified for 01.07-01.09
const CRED_SECTIONS = [
  {
    id: "log",
    flagPath: ["log", "encryption", "keyformat"],
    valuePaths: [["log", "encryption", "pwd"]],
    plainFlagValue: 0,
    encryptedFlagValue: 1
  },
  {
    id: "wifi",
    flagPath: ["connect", "wifi", "keyformat"],
    // the whole accesspoint array counts as the value (arrays merge wholesale)
    valuePaths: [["connect", "wifi", "accesspoint"]],
    plainFlagValue: 0,
    encryptedFlagValue: 1
  },
  {
    id: "cellular",
    flagPath: ["connect", "cellular", "keyformat"],
    valuePaths: [["connect", "cellular", "pin"]],
    plainFlagValue: 0,
    encryptedFlagValue: 1
  },
  {
    id: "s3",
    flagPath: ["connect", "s3", "server", "keyformat"],
    valuePaths: [["connect", "s3", "server", "secretkey"]],
    plainFlagValue: 0,
    encryptedFlagValue: 1
  },
  {
    id: "webserver",
    flagPath: ["connect", "webserver", "security"],
    valuePaths: [["connect", "webserver", "password"]],
    plainFlagValue: 1, // Basic (plain)
    encryptedFlagValue: 2 // Basic with encrypted password
  }
];

// recursive defense-in-depth scans over the (small) partial object
const scanDeep = (node, visit, path) => {
  if (Array.isArray(node)) {
    node.forEach((item, i) => scanDeep(item, visit, path + "[" + i + "]"));
  } else if (isPlainObject(node)) {
    Object.keys(node).forEach((key) => {
      const childPath = path ? path + "." + key : key;
      visit(key, node[key], childPath);
      scanDeep(node[key], visit, childPath);
    });
  }
};

// Facts about which credential-relevant paths a partial touches
export const scanPartialCredentials = (partial) => {
  const facts = {
    kpubPaths: [], // any non-empty kpub anywhere (device-specific!)
    encryptedFlagPaths: [], // any keyformat===1 / webserver security===2
    clearsKpub: false, // general.security.kpub === ""
    touchesMeta: hasPath(partial, ["general", "device", "meta"]),
    touchesAnyFlag: false,
    sections: {}
  };

  scanDeep(partial, (key, value, path) => {
    if (key === "kpub" && typeof value === "string" && value !== "") {
      facts.kpubPaths.push(path);
    }
    if (key === "keyformat" && value === 1) {
      facts.encryptedFlagPaths.push(path);
    }
  }, "");

  if (getPath(partial, ["connect", "webserver", "security"]) === 2) {
    facts.encryptedFlagPaths.push("connect.webserver.security");
  }
  if (getPath(partial, ["general", "security", "kpub"]) === "") {
    facts.clearsKpub = true;
  }

  CRED_SECTIONS.forEach((section) => {
    const flagTouched = hasPath(partial, section.flagPath);
    const flagValue = flagTouched ? getPath(partial, section.flagPath) : undefined;
    const touchesValue = section.valuePaths.some((p) => hasPath(partial, p));
    if (flagTouched) facts.touchesAnyFlag = true;
    facts.sections[section.id] = {
      flagTouched,
      setsPlainFlag: flagTouched && flagValue === section.plainFlagValue,
      touchesValue
    };
  });

  return facts;
};

// Batch-level analysis of a loaded partial: blocking errors + notes
export const analyzePartial = (partial, deletions) => {
  const blockers = [];
  const notes = [];

  if (!isPlainObject(partial)) {
    blockers.push("The partial config must be a JSON object");
    return { blockers, notes, facts: null };
  }
  if (Object.keys(partial).length === 0) {
    blockers.push("The partial config is empty - nothing to apply");
    return { blockers, notes, facts: null };
  }

  const facts = scanPartialCredentials(partial);

  if (facts.kpubPaths.length) {
    blockers.push(
      "The partial contains a server public key (" +
        facts.kpubPaths.join(", ") +
        "). Encryption keys are device-specific and must never be sent to multiple devices - load a plain-text partial and enable Encrypt passwords instead"
    );
  }
  if (facts.encryptedFlagPaths.length) {
    blockers.push(
      "The partial sets a password format to Encrypted (" +
        facts.encryptedFlagPaths.join(", ") +
        "). Encrypted passwords are device-specific and must never be sent to multiple devices - load a plain-text partial and enable Encrypt passwords instead"
    );
  }
  if (facts.clearsKpub) {
    notes.push(
      "The partial clears the server public key on all devices - devices left with encrypted passwords will be blocked individually"
    );
  }
  if (facts.touchesMeta) {
    notes.push(
      'The partial sets general.device.meta ("' +
        getPath(partial, ["general", "device", "meta"]) +
        '") - every selected device will get the same meta name'
    );
  }
  if (deletions && deletions.length) {
    notes.push(
      deletions.length +
        " deleted setting(s) from the editor changes cannot be expressed in a partial config and were excluded: " +
        deletions.join(", ") +
        ". Devices keep their current values for these"
    );
  }

  return { blockers, notes, facts };
};

// -------------------------------------------------------------------------
// shared per-device gates (device.json / revision / artifact presence)

const REV_FROM_SCHEMA = /^schema-(\d{2}\.\d{2})\.json$/;

const deviceBaseGates = (input) => {
  const { deviceId, deviceJson, config, schemaStatus, validator } = input;
  const { getConfigRevision, DEVICE_TYPE_MAP } = encryptionFields;

  if (
    !deviceJson ||
    typeof deviceJson !== "object" ||
    typeof deviceJson.id !== "string"
  ) {
    return { reason: "device.json is missing or invalid" };
  }
  if (deviceJson.id.toUpperCase() !== deviceId.toUpperCase()) {
    return {
      reason:
        "device.json id (" +
        deviceJson.id +
        ") does not match the folder (" +
        deviceId +
        ") - possibly a cloned/swapped SD card"
    };
  }
  if (DEVICE_TYPE_MAP[deviceJson.type] === undefined) {
    return { reason: 'Unrecognized device type "' + deviceJson.type + '"' };
  }

  const revCfg = getConfigRevision(deviceJson.cfg_name);
  const schMatch = REV_FROM_SCHEMA.exec(deviceJson.sch_name || "");
  const revSch = schMatch ? schMatch[1] : null;
  const revVer = deviceJson.cfg_ver;
  if (!revCfg || revCfg !== revSch || revCfg !== revVer) {
    return {
      reason:
        "device.json is inconsistent (cfg_name " +
        revCfg +
        " / sch_name " +
        revSch +
        " / cfg_ver " +
        revVer +
        ") - the device may be mid-update"
    };
  }
  if (!SUPPORTED_REVISIONS.includes(revCfg)) {
    return {
      reason:
        "Config revision " +
        revCfg +
        " is not supported (supported: " +
        SUPPORTED_REVISIONS.join(", ") +
        ")"
    };
  }

  if (!config || config.meta.status === "loading") {
    return { pending: true };
  }
  if (config.meta.status === "missing") {
    return {
      reason:
        "Current config (" +
        deviceJson.cfg_name +
        ") not found in the device folder"
    };
  }
  if (config.meta.status === "invalid" || !config.data) {
    return {
      reason: deviceJson.cfg_name + " in the device folder is not valid JSON"
    };
  }

  if (schemaStatus === "loading") {
    return { pending: true };
  }
  if (schemaStatus === "missing") {
    return {
      reason:
        "Rule schema (" + deviceJson.sch_name + ") missing in the device folder"
    };
  }
  if (schemaStatus === "invalid" || !validator) {
    return {
      reason:
        "Rule schema (" +
        deviceJson.sch_name +
        ") in the device folder is not a usable JSON Schema"
    };
  }

  return { revision: revCfg };
};

const crcSyncWarning = (deviceJson, configCrc32) => {
  if (
    typeof deviceJson.cfg_crc32 !== "string" ||
    deviceJson.cfg_crc32 === "" ||
    !configCrc32
  ) {
    return "Device has not reported a config checksum - sync state unknown";
  }
  // identical predicate to the status dashboard (prepareDataDevices.js)
  return parseInt(configCrc32, 16) === parseInt(deviceJson.cfg_crc32, 16)
    ? null
    : "Device has not yet adopted the current server config (crc32 mismatch)";
};

// generic message (no per-device day count) so the left panel can aggregate
// it into a single line; the table's heartbeat columns show the specifics
const heartbeatWarning = (heartbeatMs, nowMs) => {
  if (!heartbeatMs || !nowMs) return null;
  const age = nowMs - heartbeatMs;
  if (age <= STALE_HEARTBEAT_MS) return null;
  return "Last heartbeat more than a week ago - the device only adopts the new config when it next connects";
};

// -------------------------------------------------------------------------
// per-device encryption assessment (always on the POST-merge config)

// whether the POST-merge config can be encrypted, plus the per-field summary
// and encryption-specific warnings. Reuses the single-device building blocks.
const assessEncryption = (config, deviceJson, revision) => {
  const {
    analyzeConfigEncryption,
    validateDeviceFile,
    detectDeviceTypeFromConfig
  } = encryptionFields;

  const analysis = analyzeConfigEncryption(config);
  const checks = analysis.checks;
  const fileCheck = validateDeviceFile(
    deviceJson,
    detectDeviceTypeFromConfig(config),
    revision
  );

  let compatible = true;
  let reason = null;
  if (!fileCheck.ok) {
    compatible = false;
    reason = fileCheck.errors[0];
  } else if (!checks.noMixedFormats) {
    compatible = false;
    reason = "Some passwords are encrypted while others are plain";
  } else if (checks.lengthViolations.length) {
    compatible = false;
    reason =
      "Password too long to encrypt: " + checks.lengthViolations.join(", ");
  }

  // a blank SIM PIN staying plain is a no-op, not something to warn about; the
  // diff view in the confirm modal shows the actual per-device field changes
  const warnings = [];
  checks.blankFields.forEach((label) =>
    warnings.push("Blank password will be encrypted: " + label)
  );

  return {
    hasPlain: checks.hasPlainFields,
    compatible,
    reason,
    warnings
  };
};

// partial credential-safety gates - kept strict so a plain
// value is never written under an "encrypted" flag; the encryption analyzer
// relies on keyformat to tell plaintext from ciphertext
const partialCredentialGates = (merged, current, facts) => {
  const reasons = [];
  const mergedSections = {};
  encryptionFields
    .analyzeConfigEncryption(merged)
    .sections.forEach((s) => {
      mergedSections[s.id] = s;
    });
  const deviceSections = {};
  encryptionFields
    .analyzeConfigEncryption(current)
    .sections.forEach((s) => {
      deviceSections[s.id] = s;
    });

  CRED_SECTIONS.forEach((section) => {
    const sectionFacts = facts.sections[section.id];
    if (!sectionFacts) return;
    const mergedEncrypted =
      mergedSections[section.id] && mergedSections[section.id].keyformat === 1;
    const deviceEncrypted =
      deviceSections[section.id] && deviceSections[section.id].keyformat === 1;

    if (sectionFacts.touchesValue && mergedEncrypted) {
      reasons.push(
        "The partial sets a plain-text password (" +
          section.id +
          "), but this device's config expects it encrypted (keyformat: Encrypted). Set the format to Plain in the same partial and enable Encrypt passwords to re-encrypt it"
      );
    }
    if (sectionFacts.setsPlainFlag && !sectionFacts.touchesValue && deviceEncrypted) {
      reasons.push(
        "The partial sets the " +
          section.id +
          " password format to plain-text but does not provide the password value - the device would treat its old encrypted value as a literal password"
      );
    }
  });

  const mergedHasEncrypted = Object.keys(mergedSections).some(
    (id) => mergedSections[id].keyformat === 1
  );
  const mergedKpub = getPath(merged, ["general", "security", "kpub"]);
  if (
    (facts.clearsKpub || facts.touchesAnyFlag) &&
    mergedHasEncrypted &&
    !mergedKpub
  ) {
    reasons.push(
      "After this change the device would have encrypted passwords but no server public key - it could not decrypt its credentials"
    );
  }
  return reasons;
};

// -------------------------------------------------------------------------
// per-device firmware-update assessment (FW run only). Reuses the Phase-1
// migration helpers so fleet and single-device (editor) behavior cannot
// diverge. Returns one of:
//   { reason }                                  -> blocked (grayed)
//   { willUpdate: false }                       -> already on the target FW
//   { willUpdate: true, willMigrate, fromRevision, toRevision, targetConfigName }
export const firmwareGate = (deviceJson, firmware) => {
  const deviceType = encryptionFields.DEVICE_TYPE_MAP[deviceJson.type];

  if (!migration.checkDeviceTypeMatch(firmware.deviceType, deviceType)) {
    return {
      reason:
        "This firmware is for a " +
        firmware.deviceType +
        ", but this device is a " +
        (deviceType || "device of unknown type")
    };
  }

  // already on the exact target firmware (full MM.mm.pp compare) - nothing to do
  if (deviceJson.fw_ver && deviceJson.fw_ver === firmware.fwVer) {
    return { willUpdate: false };
  }

  // migration decision is on the 2-part revision only (patch never changes the schema)
  const cmp = migration.compareRevisions(firmware.revision, deviceJson.cfg_ver);
  if (cmp < 0) {
    return {
      reason:
        "Firmware " +
        firmware.revision +
        " is an older revision than this device's configuration (" +
        deviceJson.cfg_ver +
        ") - downgrade is not supported"
    };
  }
  if (cmp === 0) {
    // same major/minor, different patch: push firmware, existing config is compatible
    return {
      willUpdate: true,
      willMigrate: false,
      fromRevision: deviceJson.cfg_ver,
      toRevision: firmware.revision,
      targetConfigName: deviceJson.cfg_name
    };
  }
  // cmp > 0: migrate the config up to the firmware revision
  const m = migration.evaluateMigration(deviceJson.cfg_ver, firmware.revision);
  if (m.status !== "migrate") {
    return { reason: m.message };
  }
  return {
    willUpdate: true,
    willMigrate: true,
    fromRevision: deviceJson.cfg_ver,
    toRevision: firmware.revision,
    targetConfigName: "config-" + firmware.revision + ".json"
  };
};

// -------------------------------------------------------------------------
// per-device TLS-certificate gate (TLS run only). The .p7b is deployed to any
// CANedge type, but only devices on a firmware revision this tool has been
// verified against (safety precaution mirroring the firmware/config gates).
// Returns { reason } -> blocked, or { willUpdate: true }.
const REV_FROM_FW_VER = /^(\d{2}\.\d{2})\.\d{2}$/;

export const tlsGate = (deviceJson) => {
  const match = REV_FROM_FW_VER.exec(deviceJson.fw_ver || "");
  if (!match) {
    return {
      reason:
        "Device has not reported a valid firmware version (fw_ver: " +
        (deviceJson.fw_ver || "missing") +
        ")"
    };
  }
  if (!SUPPORTED_REVISIONS.includes(match[1])) {
    return {
      reason:
        "Firmware " +
        match[1] +
        " is not supported for TLS certificate updates (supported: " +
        SUPPORTED_REVISIONS.join(", ") +
        ")"
    };
  }
  return { willUpdate: true };
};

// -------------------------------------------------------------------------
// unified per-device evaluation
//
// A partial is optional. The result carries BOTH the partial-merge outcome and
// an encryption assessment on the post-merge config, computed once and
// independent of the encrypt toggle - the toggle only affects display/submit
// (derived in the selectors).
//
// input: { deviceId, deviceJson, heartbeatMs, nowMs,
//          config: { data: {text, parsed}|undefined, meta: {status, crc32} },
//          schemaStatus, validator, partial|null, facts|null }
// output: { status: "pending"|"blocked"|"eligible", eligible, reasons,
//           partialChanges, warnings, targetName, baselineCrc32,
//           currentEncStatus, enc, merged, mergedText }
export const evaluateDevice = (input) => {
  const {
    deviceJson,
    heartbeatMs,
    nowMs,
    config,
    validator,
    partial,
    facts,
    firmware,
    tls
  } = input;

  const base = deviceBaseGates(input);
  if (base.pending) {
    return { status: "pending", eligible: false, reasons: [], warnings: [] };
  }
  if (base.reason) {
    return {
      status: "blocked",
      eligible: false,
      reasons: [base.reason],
      warnings: []
    };
  }

  // base ok -> config.data.parsed and validator are present
  const current = config.data.parsed;
  const currentEncStatus = classifyCurrentEncryption(current);

  // firmware run: the FW path fully replaces the partial/encrypt path
  if (firmware) {
    const gate = firmwareGate(deviceJson, firmware);
    if (gate.reason) {
      return {
        status: "blocked",
        eligible: false,
        reasons: [gate.reason],
        warnings: [],
        currentEncStatus
      };
    }
    if (!gate.willUpdate) {
      // already on the exact target firmware - shown but not selectable
      return {
        status: "eligible",
        eligible: false,
        reasons: [],
        warnings: [],
        currentEncStatus,
        baselineCrc32: config.meta.crc32,
        targetName: deviceJson.cfg_name,
        fw: { willUpdate: false, upToDate: true }
      };
    }

    // if a migration is needed, run it now and validate against the target
    // (official) schema, so an incompatible config (e.g. from a custom firmware)
    // is caught during evaluation and grayed out rather than only failing at
    // submit. Non-migrating (patch-only) devices keep their already-valid config.
    let migratedConfig = null;
    if (gate.willMigrate) {
      const migrated = migration.migrateConfig({
        configOld: current,
        fromRevision: gate.fromRevision,
        toRevision: gate.toRevision,
        deviceType: firmware.deviceType,
        defaultConfig: firmware.defaultConfig,
        targetSchema: null // validated below with the pre-compiled target validator
      });
      if (!migrated.migratedConfig) {
        return {
          status: "blocked",
          eligible: false,
          reasons: [
            (migrated.errors && migrated.errors[0]) ||
              "Configuration File cannot be migrated to " + gate.toRevision
          ],
          warnings: [],
          currentEncStatus
        };
      }
      if (
        firmware.targetValidator &&
        !firmware.targetValidator(migrated.migratedConfig)
      ) {
        const errs = firmware.targetValidator.errors || [];
        const first = errs[0]
          ? (
              (errs[0].dataPath || errs[0].instancePath || "") +
              " " +
              errs[0].message
            ).trim()
          : "unknown error";
        const more = errs.length > 1 ? " (+" + (errs.length - 1) + " more)" : "";
        return {
          status: "blocked",
          eligible: false,
          reasons: [
            "Migrated Configuration File is not valid for firmware " +
              gate.toRevision +
              ": " +
              first +
              more
          ],
          warnings: [],
          currentEncStatus
        };
      }
      migratedConfig = migrated.migratedConfig;
    }

    const fwWarnings = [];
    const fwSync = crcSyncWarning(deviceJson, config.meta.crc32);
    if (fwSync) fwWarnings.push(fwSync);
    const fwStale = heartbeatWarning(heartbeatMs, nowMs);
    if (fwStale) fwWarnings.push(fwStale);
    return {
      status: "eligible",
      eligible: true,
      reasons: [],
      partialChanges: false,
      warnings: fwWarnings,
      targetName: gate.targetConfigName,
      baselineCrc32: config.meta.crc32,
      currentEncStatus,
      // the migrated config (when migrating) so the "New config" download
      // serves exactly what the run will write
      merged: migratedConfig || undefined,
      mergedText: migratedConfig
        ? JSON.stringify(migratedConfig, null, 2)
        : undefined,
      fw: {
        willUpdate: true,
        willMigrate: gate.willMigrate,
        fromRevision: gate.fromRevision,
        toRevision: gate.toRevision,
        targetConfigName: gate.targetConfigName
      }
    };
  }

  // TLS run: a pure binary upload - no config change, so no merge/validation
  // beyond the base gates and the firmware-revision safety gate
  if (tls) {
    const gate = tlsGate(deviceJson);
    if (gate.reason) {
      return {
        status: "blocked",
        eligible: false,
        reasons: [gate.reason],
        warnings: [],
        currentEncStatus
      };
    }
    const tlsWarnings = [];
    const tlsStale = heartbeatWarning(heartbeatMs, nowMs);
    if (tlsStale) tlsWarnings.push(tlsStale);
    return {
      status: "eligible",
      eligible: true,
      reasons: [],
      partialChanges: false,
      warnings: tlsWarnings,
      targetName: deviceJson.cfg_name,
      baselineCrc32: config.meta.crc32,
      currentEncStatus,
      tls: { willUpdate: true }
    };
  }

  const merged = partial ? mergeConfig(current, partial) : current;

  if (!validator(merged)) {
    const errors = validator.errors || [];
    const first = errors[0]
      ? (errors[0].dataPath || "config") + " " + errors[0].message
      : "unknown error";
    const more = errors.length > 1 ? " (+" + (errors.length - 1) + " more)" : "";
    return {
      status: "blocked",
      eligible: false,
      reasons: [
        "Merged config fails validation vs the device's schema: " + first + more
      ],
      warnings: [],
      currentEncStatus
    };
  }

  if (partial) {
    const gateReasons = partialCredentialGates(merged, current, facts);
    if (gateReasons.length) {
      return {
        status: "blocked",
        eligible: false,
        reasons: gateReasons,
        warnings: [],
        currentEncStatus
      };
    }
  }

  const enc = assessEncryption(merged, deviceJson, base.revision);

  const mergedText = JSON.stringify(merged, null, 2);
  const partialChanges = partial ? mergedText !== config.data.text : false;
  const eligible = partialChanges || enc.hasPlain;

  // general/partial-side warnings; encryption-specific warnings live in
  // enc.warnings and are surfaced by the selector only when the toggle is on
  const warnings = [];
  if (partialChanges) {
    editorActions
      .collectConfigurationWarnings(merged)
      .forEach((w) => warnings.push(w));
  }
  const sync = crcSyncWarning(deviceJson, config.meta.crc32);
  if (sync) warnings.push(sync);
  const stale = heartbeatWarning(heartbeatMs, nowMs);
  if (stale) warnings.push(stale);

  return {
    status: "eligible",
    eligible,
    reasons: [],
    partialChanges,
    warnings,
    targetName: deviceJson.cfg_name,
    baselineCrc32: config.meta.crc32,
    currentEncStatus,
    enc,
    merged,
    mergedText
  };
};
