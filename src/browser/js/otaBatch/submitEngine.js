// Bounded-concurrency batch submission run. A PUT only happens for a device
// that passes the full re-validation on FRESH data immediately before the
// write (mirrors canedge_manager.py cfg_update: get -> transform -> validate
// -> put, per device):
//   1. session alive (web.LoggedIn())
//   2. fresh GET of the device's config (cache: no-store)
//   3. drift check: fresh crc32 must equal the evaluation-time baseline
//   4. re-merge + full re-evaluation (partial) / fresh encrypt (encryption)
//   5. PUT-key whitelist assert, then web.PutObject
// Uses its OWN request queue instance so aborting never clears the shared
// statusRequestQueue.

import web from "../web";
import { createRequestQueue } from "../requestQueue";
import { migration } from "config-editor-tools";

import * as cache from "./cache";
import { buildEncryptedConfig } from "./encryptConfig";
import { analyzePartial, evaluateDevice, tlsGate } from "./evaluate";
import { getEncryptActive } from "./selectors";
import {
  SUBMIT_CONCURRENCY,
  STATUS_FLUSH_MS,
  PUT_NAME_REGEX,
  FW_PUT_NAME_REGEX,
  TLS_PUT_NAME_REGEX,
  TLS_FILE_NAME,
  PRESIGN_EXPIRY
} from "./constants";
import {
  RUN_START,
  RUN_APPEND,
  RUN_DEVICE_STATUS_BATCH,
  RUN_DONE
} from "./actionTypes";

let runToken = 0;
let queue = null;

// Coalesced status updates: every dispatch re-renders the device table, and an
// abort rejects all queued devices in one microtask burst. Buffering by device
// (last state wins) turns that burst into a single dispatch/render.
let pendingStatus = null;
let statusTimer = null;

const flushStatus = (dispatch) => {
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  if (!pendingStatus || !pendingStatus.size) {
    pendingStatus = null;
    return;
  }
  const updates = [];
  pendingStatus.forEach((value, deviceId) =>
    updates.push({ deviceId, state: value.state, message: value.message })
  );
  pendingStatus = null;
  dispatch({ type: RUN_DEVICE_STATUS_BATCH, updates });
};

const dropPendingStatus = () => {
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = null;
  pendingStatus = null;
};

const setDeviceStatus = (dispatch, deviceId, state, message) => {
  if (!pendingStatus) pendingStatus = new Map();
  pendingStatus.set(deviceId, { state, message });
  if (!statusTimer) {
    statusTimer = setTimeout(() => flushStatus(dispatch), STATUS_FLUSH_MS);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// web.makeCall strips err.status and rethrows "Server returned error [NNN]";
// fetchFreshConfigText keeps both err.status and a "[NNN]" message. Recover the
// HTTP status from either form so retry/messaging can key off it.
const statusOf = (e) => {
  if (e && typeof e.status === "number") return e.status;
  const m =
    e && typeof e.message === "string" && e.message.match(/\[(\d{3})\]/);
  return m ? parseInt(m[1], 10) : null;
};

// retry once (2 s) for network-class + HTTP 5xx failures only - never for 4xx
const isRetriable = (e) => {
  if (e instanceof TypeError) return true;
  const status = statusOf(e);
  if (status !== null) return status >= 500;
  return (
    e &&
    typeof e.message === "string" &&
    /network|failed to fetch|timeout|econn/i.test(e.message)
  );
};

// user-facing failure message - make the common 403 actionable
const friendlyMessage = (e) => {
  if (statusOf(e) === 403) {
    return "Access denied (403) - check the bucket write permissions for this device folder";
  }
  return e && e.message ? e.message : String(e);
};

const withOneRetry = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    if (!isRetriable(e)) throw e;
    await delay(2000);
    return fn();
  }
};

const fetchFreshConfigText = (deviceId, configName) =>
  withOneRetry(() =>
    web
      .PresignedGet({
        bucket: deviceId,
        object: configName,
        expiry: PRESIGN_EXPIRY
      })
      .then((res) => fetch(res.url, { cache: "no-store" }))
      .then((r) => {
        if (!r.ok) {
          const err = new Error(
            "Could not fetch the device's current config [" + r.status + "]"
          );
          err.status = r.status;
          throw err;
        }
        return r.text();
      })
  );

const putConfig = (deviceId, configName, body) => {
  const objectName = deviceId + "/" + configName;
  if (
    !PUT_NAME_REGEX.test(objectName) ||
    objectName.indexOf(deviceId + "/") !== 0
  ) {
    // defense-in-depth: should be unreachable
    throw new Error("Internal error - refusing to write to " + objectName);
  }
  return withOneRetry(() => web.PutObject({ objectName, file: body }));
};

// abort a binary upload after this long without any request-body progress
const FW_INACTIVITY_TIMEOUT_MS = 30000;

// One binary PUT attempt (firmware.bin / certs_server.p7b) via a presigned URL
// + XHR - the same transport uploads/uploadEngine.js uses. The JSON-RPC
// web.PutObject path stringifies the body and must NOT be used for binary.
const xhrPutBinary = (url, file, label) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let timer = null;
    let timedOut = false;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timedOut = true;
        xhr.abort();
      }, FW_INACTIVITY_TIMEOUT_MS);
    };
    const done = () => clearTimeout(timer);
    xhr.open("PUT", url, true);
    xhr.onload = () => {
      done();
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        const err = new Error(label + " upload failed [" + xhr.status + "]");
        err.status = xhr.status;
        reject(err);
      }
    };
    xhr.onerror = () => {
      done();
      reject(new TypeError("Network error during " + label + " upload"));
    };
    xhr.onabort = () => {
      done();
      reject(
        new Error(
          timedOut
            ? label +
              " upload timeout - no data sent for " +
              FW_INACTIVITY_TIMEOUT_MS / 1000 +
              "s"
            : label + " upload aborted"
        )
      );
    };
    xhr.upload.addEventListener("progress", arm);
    arm();
    xhr.send(file);
  });

const putFirmwareBin = (deviceId, file) => {
  const objectName = deviceId + "/firmware.bin";
  if (
    !FW_PUT_NAME_REGEX.test(objectName) ||
    objectName.indexOf(deviceId + "/") !== 0
  ) {
    throw new Error("Internal error - refusing to write to " + objectName);
  }
  // fresh presigned URL per attempt (signing is local, no request)
  return withOneRetry(() =>
    web
      .PresignedPutObject({
        bucketName: deviceId,
        objectName: "firmware.bin",
        expiry: PRESIGN_EXPIRY
      })
      .then((res) => xhrPutBinary(res.url, file, "Firmware"))
  );
};

const putTlsCerts = (deviceId, file) => {
  const objectName = deviceId + "/" + TLS_FILE_NAME;
  if (
    !TLS_PUT_NAME_REGEX.test(objectName) ||
    objectName.indexOf(deviceId + "/") !== 0
  ) {
    throw new Error("Internal error - refusing to write to " + objectName);
  }
  // Raw variant: PresignedPutObject rewrites "_" to "/" (upload-filename
  // convention), which would mangle certs_server.p7b into certs/server.p7b
  return withOneRetry(() =>
    web
      .PresignedPutObjectRaw({
        bucketName: deviceId,
        objectName: TLS_FILE_NAME,
        expiry: PRESIGN_EXPIRY
      })
      .then((res) => xhrPutBinary(res.url, file, "Certificate"))
  );
};

// TLS run for one device: a single binary PUT of the certs_server.p7b to the
// device root. No config is read or written, so there is no fresh-config GET
// or crc32 drift check - only the (pure) firmware-revision gate is re-checked.
const submitTlsDevice = async (dispatch, deviceId, token, deviceJson, tls) => {
  const gate = tlsGate(deviceJson);
  if (gate.reason) {
    throw new Error(gate.reason);
  }
  await putTlsCerts(deviceId, tls.file);
  if (token !== runToken) return;
  setDeviceStatus(dispatch, deviceId, "submitted");
};

// firmware run for one device: fresh GET + drift check + re-gate, then migrate
// the config (if needed) and PUT it BEFORE the firmware.bin so the device has a
// compatible config when the new firmware boots (canedge_manager.py fw_update)
const submitFirmwareDevice = async (
  dispatch,
  getState,
  deviceId,
  token,
  deviceJson,
  evaluation,
  validator,
  firmware
) => {
  const freshText = await fetchFreshConfigText(deviceId, deviceJson.cfg_name);
  if (cache.crc32Hex(freshText) !== evaluation.baselineCrc32) {
    throw new Error(
      "Config changed on the server since review - use Retry failed to re-evaluate and resubmit"
    );
  }
  const freshParsed = JSON.parse(freshText);

  // authoritative re-run of the firmware gate on fresh data
  const result = evaluateDevice({
    deviceId,
    deviceJson,
    heartbeatMs: null,
    nowMs: null,
    config: {
      data: { text: freshText, parsed: freshParsed },
      meta: { status: "loaded", crc32: cache.crc32Hex(freshText) }
    },
    schemaStatus: "loaded",
    validator,
    partial: null,
    facts: null,
    firmware
  });
  if (result.status === "blocked") {
    throw new Error(
      result.reasons && result.reasons[0]
        ? result.reasons[0]
        : "Firmware update is no longer applicable"
    );
  }
  const fw = result.fw;
  if (!fw || !fw.willUpdate) {
    if (token !== runToken) return;
    setDeviceStatus(dispatch, deviceId, "submitted", "Already on this firmware");
    return;
  }

  // 1. config-before-firmware: migrate + validate + PUT the new config first
  let configWritten = false;
  if (fw.willMigrate) {
    const migrated = migration.migrateConfig({
      configOld: freshParsed,
      fromRevision: fw.fromRevision,
      toRevision: fw.toRevision,
      deviceType: firmware.deviceType,
      defaultConfig: firmware.defaultConfig,
      targetSchema: firmware.targetSchema
    });
    if (!migrated.valid) {
      throw new Error(
        "Migrated config is invalid: " +
          (migrated.errors && migrated.errors[0]
            ? migrated.errors[0]
            : "unknown error")
      );
    }
    await putConfig(
      deviceId,
      fw.targetConfigName,
      JSON.stringify(migrated.migratedConfig, null, 2)
    );
    configWritten = true;
  }

  // 2. only after the config write (if any) succeeds, PUT the firmware.bin
  try {
    await putFirmwareBin(deviceId, firmware.file);
  } catch (e) {
    if (configWritten) {
      // config landed but firmware failed - the safe direction (config is
      // forward-compatible); surface a distinct, retriable message
      throw new Error(
        "Config updated, but the firmware upload failed (use Retry failed): " +
          friendlyMessage(e)
      );
    }
    throw e;
  }

  if (token !== runToken) return;
  setDeviceStatus(dispatch, deviceId, "submitted");
};

const submitDevice = async (dispatch, getState, deviceId, token) => {
  if (token !== runToken) return;

  if (!web.LoggedIn()) {
    // abort everything still queued; in-flight tasks fail the same check
    if (queue) queue.clear();
    throw new Error("Session expired - please log in again");
  }

  setDeviceStatus(dispatch, deviceId, "submitting");

  const state = getState().otaBatch;
  const deviceJson = state.deviceFiles[deviceId];
  const evaluation = state.evaluations[deviceId];
  const validator = cache.getValidator(deviceId);

  if (!deviceJson || !evaluation || !evaluation.eligible || !validator) {
    throw new Error("Device is no longer ready - re-evaluate");
  }

  // firmware run: migrate (if needed) -> PUT config -> PUT firmware.bin
  const firmware = state.loadedFirmware ? cache.getFirmware() : null;
  if (firmware) {
    return submitFirmwareDevice(
      dispatch,
      getState,
      deviceId,
      token,
      deviceJson,
      evaluation,
      validator,
      firmware
    );
  }

  // TLS run: PUT the certs_server.p7b to the device root (nothing else)
  const tls = state.loadedTls ? cache.getTls() : null;
  if (tls) {
    return submitTlsDevice(dispatch, deviceId, token, deviceJson, tls);
  }

  // fresh baseline + drift check
  const freshText = await fetchFreshConfigText(deviceId, deviceJson.cfg_name);
  if (cache.crc32Hex(freshText) !== evaluation.baselineCrc32) {
    throw new Error(
      "Config changed on the server since review - use Retry failed to re-evaluate and resubmit"
    );
  }
  const freshParsed = JSON.parse(freshText); // crc matched -> parses like the baseline

  let mergedText;

  // effective encrypt intent is stable during a run (the toggle + selection are
  // locked while a run is active)
  const encryptActive =
    getEncryptActive(getState()) &&
    evaluation.enc &&
    evaluation.enc.hasPlain &&
    evaluation.enc.compatible;

  // authoritative re-run of the evaluation on the FRESH text - re-checks the
  // partial safety gates AND the post-merge encryption compatibility
  const analysis = state.partial
    ? analyzePartial(state.partial, state.partialDeletions)
    : null;
  const result = evaluateDevice({
    deviceId,
    deviceJson,
    heartbeatMs: null,
    nowMs: null,
    config: {
      data: { text: freshText, parsed: freshParsed },
      meta: { status: "loaded", crc32: cache.crc32Hex(freshText) }
    },
    schemaStatus: "loaded",
    validator,
    partial: state.partial,
    facts: analysis ? analysis.facts : null
  });
  if (result.status === "blocked") {
    throw new Error(
      result.reasons && result.reasons[0]
        ? result.reasons[0]
        : "Validation failed"
    );
  }

  const base = result.merged; // post-merge (or the raw config when no partial)
  const willEncrypt =
    encryptActive && result.enc && result.enc.hasPlain && result.enc.compatible;

  if (!result.partialChanges && !willEncrypt) {
    if (token !== runToken) return; // run was invalidated during the GET
    setDeviceStatus(
      dispatch,
      deviceId,
      "submitted",
      "No changes (already applied)"
    );
    return;
  }

  if (willEncrypt) {
    // fresh analysis + fresh ephemeral key PER DEVICE, on the POST-merge config
    mergedText = (
      await buildEncryptedConfig(base, deviceJson.kpub, validator)
    ).text;
  } else {
    mergedText = result.mergedText;
  }

  await putConfig(deviceId, deviceJson.cfg_name, mergedText);
  // the PUT was validated against fresh data and is allowed to complete even if
  // the run was invalidated meanwhile; only skip the (now-stale) status dispatch
  if (token !== runToken) return;
  setDeviceStatus(dispatch, deviceId, "submitted");
};

const runTasks = (dispatch, getState, deviceIds, token) => {
  const tasks = deviceIds.map((deviceId) =>
    queue
      .add(() => submitDevice(dispatch, getState, deviceId, token))
      .catch((err) => {
        if (token !== runToken) return;
        if (err && err.message === "cancelled") {
          setDeviceStatus(dispatch, deviceId, "aborted");
        } else {
          setDeviceStatus(dispatch, deviceId, "error", friendlyMessage(err));
        }
      })
  );

  return Promise.all(tasks).then(() => {
    // the final states must land before RUN_DONE flips the footer to its summary
    flushStatus(dispatch);
    if (token === runToken) {
      dispatch({ type: RUN_DONE });
    }
  });
};

// fresh run: RUN_START resets the run slice for the selected devices
export const startRun = (dispatch, getState, deviceIds) => {
  runToken += 1;
  const token = runToken;
  dropPendingStatus(); // no leftovers from a previous run
  queue = createRequestQueue(SUBMIT_CONCURRENCY);
  dispatch({ type: RUN_START, deviceIds });
  return runTasks(dispatch, getState, deviceIds, token);
};

// retry-failed: re-queue the given devices INTO the existing run (RUN_APPEND)
// so the already-submitted rows and the cumulative summary are preserved
export const retryRun = (dispatch, getState, deviceIds) => {
  runToken += 1;
  const token = runToken;
  dropPendingStatus(); // no leftovers from a previous run
  queue = createRequestQueue(SUBMIT_CONCURRENCY);
  dispatch({ type: RUN_APPEND, deviceIds });
  return runTasks(dispatch, getState, deviceIds, token);
};

export const abortRun = () => {
  if (queue) queue.clear();
};

// invalidate any in-flight run (view teardown): queued tasks are dropped and
// late task results exit silently on the token check
export const invalidateRun = () => {
  runToken += 1;
  dropPendingStatus(); // the slice is being reset - never dispatch into it
  if (queue) queue.clear();
};
