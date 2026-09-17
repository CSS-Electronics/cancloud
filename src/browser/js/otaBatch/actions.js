import web from "../web";
import history from "../history";
import { pathSlice } from "../utils";
import { statusRequestQueue } from "../requestQueue";
import { nextSort } from "../tableSort";
import * as dashboardStatusActions from "../dashboardStatus/actions";
import * as alertActions from "../alert/actions";
import { encryptionFields, migration } from "config-editor-tools";
import { loadFile } from "config-editor-base";

import * as cache from "./cache";
import { analyzePartial, evaluateDevice } from "./evaluate";
import { buildEncryptedConfig } from "./encryptConfig";
import { getEncryptActive } from "./selectors";
import {
  startRun as engineStartRun,
  retryRun as engineRetryRun,
  abortRun as engineAbortRun,
  invalidateRun as engineInvalidateRun
} from "./submitEngine";
import {
  DEVICE_FOLDER_REGEX,
  PRESIGN_EXPIRY,
  SUPPORTED_REVISIONS,
  TLS_FILE_NAME,
  TLS_MAX_FILE_SIZE
} from "./constants";
import {
  SET_ENCRYPT_PASSWORDS,
  SET_DEVICE_DATA,
  SET_PARTIAL,
  CLEAR_PARTIAL,
  SET_ARTIFACTS_REQUESTED,
  PATCH_ARTIFACTS,
  SET_EVALUATIONS,
  SET_EVAL_PROGRESS,
  BUMP_EVAL_TOKEN,
  SET_QUERY,
  SET_SORT,
  TOGGLE_SELECT,
  SET_SELECTION,
  SET_CONFIRM_OPEN,
  SET_ACTIVE_TAB,
  SET_FIRMWARE,
  CLEAR_FIRMWARE,
  SET_TLS,
  CLEAR_TLS,
  RUN_ABORT_REQUESTED,
  RUN_DEVICE_STATUS,
  RESET
} from "./actionTypes";

export * from "./actionTypes";

export const setQuery = (query) => ({ type: SET_QUERY, query });

export const toggleSort = (sortBy) => {
  return function (dispatch, getState) {
    const state = getState().otaBatch;
    dispatch({
      type: SET_SORT,
      ...nextSort(state.sortBy, state.sortDesc, sortBy)
    });
  };
};

export const toggleSelect = (deviceId) => ({ type: TOGGLE_SELECT, deviceId });
export const setSelection = (selected) => ({ type: SET_SELECTION, selected });
export const setConfirmOpen = (open) => ({ type: SET_CONFIRM_OPEN, open });

// ---------------------------------------------------------------------------
// bootstrap: device folders + device.json contents (reuses the queued
// dashboard loader, which also populates the sidebar meta names)

export const bootstrapDeviceData = () => {
  return function (dispatch, getState) {
    const devices = getState().buckets.list.filter((bucket) =>
      DEVICE_FOLDER_REGEX.test(bucket)
    );

    return dispatch(
      dashboardStatusActions.fetchDeviceFileContentAll(
        devices.map((deviceId) => ({ deviceId }))
      )
    ).then((results) => {
      dispatch({ type: SET_DEVICE_DATA, devices, results: results || [] });
      // a partial may already be loaded (transfer from the editor); force a
      // config/schema refresh on every view entry so evaluations never run
      // on stale data from a previous visit
      return dispatch(ensureArtifacts(true));
    });
  };
};

// manual refresh triggered from the table's refresh button: re-fetch every
// device.json (fresh heartbeat + reported cfg_crc32) and force a config/schema
// reload + re-evaluation. Supports the "deploy to one, confirm it syncs, then
// roll out to the rest" workflow.
export const refresh = () => bootstrapDeviceData();

// ---------------------------------------------------------------------------
// per-device config + schema loader (own loader: keeps RAW text in the module
// cache - crc32/drift checks must run over the file's real bytes)

const fetchDeviceObjectText = (deviceId, objectName) =>
  web
    .PresignedGet({
      bucket: deviceId,
      object: objectName,
      expiry: PRESIGN_EXPIRY
    })
    .then((res) => statusRequestQueue.add(() => fetch(res.url)))
    .then((r) => {
      if (!r.ok) return { status: "missing" };
      return r.text().then((text) => ({ status: "loaded", text }));
    })
    .catch(() => ({ status: "missing" }));

const fetchArtifactsFor = (dispatch, getState, deviceIds) => {
  const { deviceFiles } = getState().otaBatch;

  const targets = deviceIds.filter((deviceId) => {
    const deviceJson = deviceFiles[deviceId];
    return (
      deviceJson &&
      typeof deviceJson === "object" &&
      typeof deviceJson.cfg_name === "string" &&
      typeof deviceJson.sch_name === "string"
    );
  });

  // mark everything as loading in one dispatch
  const loadingPatch = {};
  targets.forEach((deviceId) => {
    loadingPatch[deviceId] = {
      config: { status: "loading" },
      schema: { status: "loading" }
    };
  });
  dispatch({ type: PATCH_ARTIFACTS, patch: loadingPatch });

  // buffered status flushes to avoid one render per device on big fleets
  let buffer = {};
  let buffered = 0;
  const flush = () => {
    if (!buffered) return;
    dispatch({ type: PATCH_ARTIFACTS, patch: buffer });
    buffer = {};
    buffered = 0;
  };
  const patch = (deviceId, part) => {
    const existing =
      buffer[deviceId] || { ...getState().otaBatch.artifacts[deviceId] };
    buffer[deviceId] = { ...existing, ...part };
    buffered += 1;
    if (buffered >= 20) flush();
  };

  const jobs = [];
  targets.forEach((deviceId) => {
    const deviceJson = deviceFiles[deviceId];
    jobs.push(
      fetchDeviceObjectText(deviceId, deviceJson.cfg_name).then((res) => {
        const meta =
          res.status === "loaded"
            ? cache.setConfig(deviceId, res.text)
            : { status: "missing" };
        patch(deviceId, { config: meta });
      })
    );
    jobs.push(
      fetchDeviceObjectText(deviceId, deviceJson.sch_name).then((res) => {
        const meta =
          res.status === "loaded"
            ? { status: cache.setSchema(deviceId, res.text).status }
            : { status: "missing" };
        patch(deviceId, { schema: meta });
      })
    );
  });

  return Promise.all(jobs).then(() => {
    flush();
    // chain the evaluation wave: callers (retryFailed, the Refresh spinner)
    // resolve only once the new evaluations are in the store
    return dispatch(evaluateAll());
  });
};

export const ensureArtifacts = (force) => {
  return function (dispatch, getState) {
    const state = getState().otaBatch;
    // the dashboard + the per-device encryption assessment need the configs
    // and schemas regardless of whether a partial is loaded; only a broken
    // partial suppresses evaluation
    const needed = !(state.partial && state.partialBlockers.length);

    if (!needed || !state.devicesLoaded) {
      return Promise.resolve();
    }
    if (state.artifactsRequested && !force) {
      return dispatch(evaluateAll());
    }
    dispatch({ type: SET_ARTIFACTS_REQUESTED });
    return fetchArtifactsFor(dispatch, getState, state.devices);
  };
};

// re-fetch configs for specific devices (retry-failed path: the fresh text
// becomes the new reviewed baseline before resubmission)
export const refreshConfigs = (deviceIds) => {
  return function (dispatch, getState) {
    return fetchArtifactsFor(dispatch, getState, deviceIds);
  };
};

// ---------------------------------------------------------------------------
// evaluation

// evaluating one device costs ~10ms (deep merge + full ajv validation), so a
// fleet-sized loop would freeze the tab for seconds. Work in time slices short
// enough to stay under the browser's 50ms "long task" bar, yielding between
// them so the progress line paints and the tab stays responsive.
const EVAL_SLICE_MS = 40;
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

export const evaluateAll = () => {
  return function (dispatch, getState) {
    dispatch({ type: BUMP_EVAL_TOKEN });
    // one snapshot for the whole wave. Safe to read across the async slices
    // ONLY because every path that mutates devices/artifacts/deviceFiles also
    // dispatches a new evaluateAll, whose BUMP_EVAL_TOKEN makes this wave bail
    // at its next slice - keep that invariant when adding mutators.
    const state = getState().otaBatch;
    const token = state.evalToken;

    const evaluations = {};
    // built locally and swapped in atomically on completion, so the previous
    // wave's merged results stay readable (downloadNewConfig) during the wave
    const mergedResults = new Map();

    // a partial is optional; a broken partial suppresses evaluation entirely
    if (state.partial && state.partialBlockers.length) {
      cache.clearMergedResults();
      dispatch({ type: SET_EVALUATIONS, evaluations, token });
      return Promise.resolve();
    }

    const analysis = state.partial
      ? analyzePartial(state.partial, state.partialDeletions)
      : null;
    const firmware = state.loadedFirmware ? cache.getFirmware() : null;
    const tls = state.loadedTls ? cache.getTls() : null;
    const nowMs = Date.now();

    const evaluateOne = (deviceId) => {
      const artifact = state.artifacts[deviceId] || {};
      const input = {
        deviceId,
        deviceJson: state.deviceFiles[deviceId],
        heartbeatMs: state.heartbeats[deviceId],
        nowMs,
        config: {
          data: cache.getConfig(deviceId),
          meta: artifact.config || { status: "loading" }
        },
        schemaStatus: (artifact.schema || { status: "loading" }).status,
        validator: cache.getValidator(deviceId),
        partial: state.partial,
        facts: analysis ? analysis.facts : null,
        firmware,
        tls
      };

      const result = evaluateDevice(input);

      // bulky merge results (the post-merge base for download/submit) stay in
      // the module cache
      if (result.merged) {
        mergedResults.set(deviceId, {
          merged: result.merged,
          mergedText: result.mergedText
        });
      }
      evaluations[deviceId] = {
        status: result.status,
        eligible: result.eligible,
        reasons: result.reasons,
        warnings: result.warnings,
        targetName: result.targetName,
        baselineCrc32: result.baselineCrc32,
        partialChanges: result.partialChanges,
        currentEncStatus: result.currentEncStatus,
        enc: result.enc,
        fw: result.fw,
        tls: result.tls
      };
    };

    const devices = state.devices;
    const step = (start) => {
      // a newer wave superseded this one (e.g. another file was loaded) - drop
      // out rather than finish work whose SET_EVALUATIONS would be ignored
      if (getState().otaBatch.evalToken !== token) return Promise.resolve();

      const sliceStart = Date.now();
      let index = start;
      while (index < devices.length && Date.now() - sliceStart < EVAL_SLICE_MS) {
        evaluateOne(devices[index]);
        index += 1;
      }
      if (index >= devices.length) {
        cache.replaceMergedResults(mergedResults);
        dispatch({ type: SET_EVALUATIONS, evaluations, token });
        return Promise.resolve();
      }
      dispatch({
        type: SET_EVAL_PROGRESS,
        token,
        progress: { done: index, total: devices.length }
      });
      return nextTick().then(() => step(index));
    };

    return step(0);
  };
};

// ---------------------------------------------------------------------------
// partial loading (file upload + editor transfer)

export const loadPartialFile = (fileName, rawText) => {
  return function (dispatch) {
    let parsed = null;
    let blockers = [];
    let notes = [];
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      blockers = ["The selected file is not valid JSON: " + e.message];
    }
    if (!blockers.length) {
      const analysis = analyzePartial(parsed, []);
      blockers = analysis.blockers;
      notes = analysis.notes;
    }
    // SET_PARTIAL clears loadedFirmware/loadedTls in redux; drop the cached Files too
    cache.clearFirmware();
    cache.clearTls();
    dispatch({
      type: SET_PARTIAL,
      partial: parsed,
      deletions: [],
      source: { kind: "file", fileName },
      blockers,
      notes
    });
    return dispatch(ensureArtifacts());
  };
};

// the editor route segment -> the canonical device folder id, or null. Matches
// case-insensitively (and tolerates a trailing slash) so the seeded selection
// key can never be a near-miss of the real folder name.
const resolveDeviceFolder = (buckets, prefix) => {
  const candidate = (prefix || "").replace(/\/+$/, "");
  if (!DEVICE_FOLDER_REGEX.test(candidate)) return null;
  return (
    (buckets || []).find(
      (bucket) => bucket.toUpperCase() === candidate.toUpperCase()
    ) || null
  );
};

// called from the editor's Review-changes modal ("Transfer to OTA batch manager")
export const receivePartialFromEditor = ({ partial, deletions, configName }) => {
  return function (dispatch, getState) {
    const { prefix } = pathSlice(history.location.pathname);
    const sourceDeviceId = resolveDeviceFolder(getState().buckets.list, prefix);
    const analysis = analyzePartial(partial, deletions || []);

    // SET_PARTIAL clears loadedFirmware/loadedTls in redux; drop the cached Files too
    cache.clearFirmware();
    cache.clearTls();
    dispatch({
      type: SET_PARTIAL,
      partial,
      deletions: deletions || [],
      source: {
        kind: "editor",
        deviceId: sourceDeviceId || prefix || null,
        configName: configName || null,
        revision: encryptionFields.getConfigRevision(configName || "")
      },
      blockers: analysis.blockers,
      notes: analysis.notes
    });

    // the config came from one known device - pre-select it so a single-device
    // rollout needs no extra click. SET_EVALUATIONS prunes it again if that
    // device turns out blocked or unchanged.
    if (sourceDeviceId) {
      dispatch({ type: SET_SELECTION, selected: { [sourceDeviceId]: true } });
    }

    history.push("/ota-batch-manager/");
    // artifacts load once the view bootstraps (bootstrapDeviceData calls
    // ensureArtifacts); if device data is already present, evaluate right away
    return dispatch(ensureArtifacts());
  };
};

export const clearPartial = () => {
  return function (dispatch, getState) {
    if (getState().otaBatch.run.active) return;
    dispatch({ type: CLEAR_PARTIAL });
    // CLEAR_PARTIAL empties evaluations; re-run so the base (no-partial)
    // eligibility is restored and devices are selectable again instead of
    // stuck on "Evaluating" until a manual refresh (mirrors clearFirmware)
    return dispatch(ensureArtifacts());
  };
};

// the encrypt toggle is a pure display/behaviour switch - eligibility and the
// per-device encryption assessment are already computed, so no re-evaluation
export const setEncryptPasswords = (value) => {
  return function (dispatch, getState) {
    if (getState().otaBatch.run.active) return;
    dispatch({ type: SET_ENCRYPT_PASSWORDS, value });
  };
};

// ---------------------------------------------------------------------------
// firmware loading (Update FW tab) - mutually exclusive with the config flow

export const setActiveTab = (tab) => {
  return function (dispatch, getState) {
    if (getState().otaBatch.run.active) return;
    dispatch({ type: SET_ACTIVE_TAB, tab });
  };
};

// parse + verify an uploaded firmware.bin, then load it as the batch target.
// Reads only the header + embedded JSON (never the full ~50 MB image).
export const loadFirmwareFile = (file) => {
  return function (dispatch, getState) {
    if (getState().otaBatch.run.active) return Promise.resolve();

    const fail = (message) =>
      dispatch(
        alertActions.set({ type: "warning", message, autoClear: false })
      );

    return Promise.resolve(file.slice(0, 64).arrayBuffer())
      .then((header) => {
        const span = migration.firmwareSpan(header);
        const end = Math.min(file.size, Math.max(span, 64));
        return file.slice(0, end).arrayBuffer();
      })
      .then((buffer) => {
        const fw = migration.parseFirmwareBin(buffer);

        // must be a revision this tool can migrate to (hops 01.07-01.09)
        if (!SUPPORTED_REVISIONS.includes(fw.revision)) {
          fail(
            "This tool supports firmware revisions " +
              SUPPORTED_REVISIONS.join(", ") +
              " (this firmware is " +
              fw.revision +
              ")"
          );
          return;
        }
        // known/official firmware: its embedded default config must validate
        // against our bundled dist schema for this device type + revision
        const targetSchema = loadFile(
          "schema-" + fw.revision + ".json | " + fw.deviceType
        );
        if (!targetSchema) {
          fail(
            "No reference schema is bundled for " +
              fw.deviceType +
              " " +
              fw.revision +
              " - cannot verify this firmware"
          );
          return;
        }
        if (!migration.checkKnownFirmware(fw.defaultConfig, targetSchema)) {
          fail(
            "This firmware.bin does not contain a recognized CANedge configuration (possibly custom firmware). It is not supported."
          );
          return;
        }

        // bulky bytes/schema stay in the module cache; redux holds a summary
        // (SET_FIRMWARE clears loadedTls in redux; drop the cached File too)
        cache.clearTls();
        cache.setFirmware({
          file,
          deviceType: fw.deviceType,
          fwVer: fw.fwVer,
          revision: fw.revision,
          defaultConfig: fw.defaultConfig,
          targetSchema
        });
        dispatch({
          type: SET_FIRMWARE,
          firmware: {
            fileName: file.name,
            deviceType: fw.deviceType,
            fwVer: fw.fwVer,
            revision: fw.revision
          }
        });
        return true;
      })
      .catch((e) => {
        fail(
          "Could not read this firmware.bin: " +
            (e && e.message ? e.message : String(e))
        );
        return false;
      })
      // outside the catch so an artifact-refresh failure is not reported as
      // an unreadable firmware.bin
      .then((loaded) => (loaded ? dispatch(ensureArtifacts()) : undefined));
  };
};

export const clearFirmware = () => {
  return function (dispatch, getState) {
    if (getState().otaBatch.run.active) return;
    cache.clearFirmware();
    dispatch({ type: CLEAR_FIRMWARE });
    // CLEAR_FIRMWARE empties evaluations; re-run so the base (no-firmware,
    // no-partial) eligibility is restored and devices are selectable again
    return dispatch(ensureArtifacts());
  };
};

// ---------------------------------------------------------------------------
// TLS certificate loading (Update TLS tab) - mutually exclusive with the
// config and firmware flows. The .p7b is opaque to the tool: only the exact
// file name and a sane size are enforced, the device validates the bundle.

export const loadTlsFile = (file) => {
  return function (dispatch, getState) {
    if (getState().otaBatch.run.active) return;

    const fail = (message) =>
      dispatch(
        alertActions.set({ type: "warning", message, autoClear: false })
      );

    if (file.name !== TLS_FILE_NAME) {
      fail(
        'The file must be named "' +
          TLS_FILE_NAME +
          '" - the device only picks up this exact name'
      );
      return;
    }
    if (!file.size) {
      fail("The selected " + TLS_FILE_NAME + " is empty");
      return;
    }
    if (file.size > TLS_MAX_FILE_SIZE) {
      fail(
        "The selected " +
          TLS_FILE_NAME +
          " is larger than " +
          Math.round(TLS_MAX_FILE_SIZE / 1024) +
          " KB - this does not look like a certificate bundle"
      );
      return;
    }

    // SET_TLS clears loadedFirmware in redux; drop the cached firmware File too
    cache.clearFirmware();
    cache.setTls({ file });
    dispatch({ type: SET_TLS, tls: { fileName: file.name, size: file.size } });
    return dispatch(ensureArtifacts());
  };
};

export const clearTls = () => {
  return function (dispatch, getState) {
    if (getState().otaBatch.run.active) return;
    cache.clearTls();
    dispatch({ type: CLEAR_TLS });
    // CLEAR_TLS empties evaluations; re-run so the base eligibility is
    // restored and devices are selectable again (mirrors clearFirmware)
    return dispatch(ensureArtifacts());
  };
};

// ---------------------------------------------------------------------------
// "New config" column download - the exact resulting config per device

const downloadJsonFile = (fileName, text) => {
  const anchor = document.createElement("a");
  anchor.href = "data:text/json;charset=utf-8," + encodeURIComponent(text);
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

// the encrypt toggle is effective for this device (the predicate the run uses)
const willEncryptDevice = (rootState, evaluation) =>
  getEncryptActive(rootState) &&
  !!evaluation &&
  !!evaluation.enc &&
  evaluation.enc.hasPlain &&
  evaluation.enc.compatible;

export const downloadNewConfig = (deviceId) => {
  return function (dispatch, getState) {
    const rootState = getState();
    const state = rootState.otaBatch;
    const deviceJson = state.deviceFiles[deviceId];
    const evaluation = state.evaluations[deviceId];
    // targetName differs from cfg_name in a firmware run that migrates
    const fileName =
      deviceId +
      "_" +
      ((evaluation && evaluation.targetName) ||
        (deviceJson ? deviceJson.cfg_name : "config.json"));

    // the post-merge base (partial applied if loaded, else the raw config)
    const mergedResult = cache.getMergedResult(deviceId);
    const config = cache.getConfig(deviceId);
    const base = mergedResult
      ? mergedResult.merged
      : config
      ? config.parsed
      : null;
    if (!base) return Promise.resolve();

    if (!willEncryptDevice(rootState, evaluation)) {
      downloadJsonFile(fileName, JSON.stringify(base, null, 2));
      return Promise.resolve();
    }

    // encryption preview: build a delta on the POST-merge base with a fresh
    // ephemeral key. The submission re-encrypts with another fresh key
    // (structure and fields identical, ciphertexts differ)
    if (!deviceJson) return Promise.resolve();
    return buildEncryptedConfig(base, deviceJson.kpub, null)
      .then((result) => {
        downloadJsonFile(fileName, result.text);
      })
      .catch((e) => {
        dispatch(
          alertActions.set({
            type: "danger",
            message: "Could not build the encrypted preview: " + e.message,
            autoClear: true
          })
        );
      });
  };
};

// The confirm modal's diff needs the same encrypted result the download serves.
// Rejects rather than alerting - the modal covers the alert area, so the panel
// renders the failure inline instead.
export const buildEncryptedPreview = (deviceId) => {
  return function (dispatch, getState) {
    const rootState = getState();
    const state = rootState.otaBatch;
    const deviceJson = state.deviceFiles[deviceId];
    const mergedResult = cache.getMergedResult(deviceId);
    if (
      !mergedResult ||
      !deviceJson ||
      !willEncryptDevice(rootState, state.evaluations[deviceId])
    ) {
      return Promise.resolve(null);
    }
    return buildEncryptedConfig(mergedResult.merged, deviceJson.kpub, null).then(
      (result) => result.text
    );
  };
};

// ---------------------------------------------------------------------------
// run control (see submitEngine.js)

// refresh the configs of successfully submitted devices once a run finishes:
// their rows re-evaluate as "unchanged" with a fresh crc32 (truthful UI +
// idempotent resume)
const refreshSubmitted = (dispatch, getState, deviceIds) => {
  const status = getState().otaBatch.run.deviceStatus;
  const succeeded = deviceIds.filter(
    (deviceId) => status[deviceId] && status[deviceId].state === "submitted"
  );
  if (succeeded.length) {
    return dispatch(refreshConfigs(succeeded));
  }
  return Promise.resolve();
};

// a device is submitted only if it will actually change: a partial change
// and/or (when the encrypt toggle is effectively on) an encryptable device
const willChange = (evaluation, encryptActive) => {
  if (!evaluation || !evaluation.eligible) return false;
  const willEncrypt =
    encryptActive &&
    evaluation.enc &&
    evaluation.enc.hasPlain &&
    evaluation.enc.compatible;
  const willFirmware = evaluation.fw && evaluation.fw.willUpdate;
  const willTls = evaluation.tls && evaluation.tls.willUpdate;
  return (
    !!evaluation.partialChanges || !!willEncrypt || !!willFirmware || !!willTls
  );
};

export const startRun = () => {
  return function (dispatch, getState) {
    const rootState = getState();
    const state = rootState.otaBatch;
    const encryptActive = getEncryptActive(rootState);
    const deviceIds = Object.keys(state.selected).filter((deviceId) =>
      willChange(state.evaluations[deviceId], encryptActive)
    );
    if (!deviceIds.length || state.run.active) return;
    engineStartRun(dispatch, getState, deviceIds).then(() =>
      refreshSubmitted(dispatch, getState, deviceIds)
    );
  };
};

// re-fetch the failed devices' configs (fresh baseline), re-evaluate, then
// resubmit those that are ready again
export const retryFailed = () => {
  return function (dispatch, getState) {
    const state = getState().otaBatch;
    if (state.run.active) return;
    const failed = Object.keys(state.run.deviceStatus).filter(
      (deviceId) => state.run.deviceStatus[deviceId].state === "error"
    );
    if (!failed.length) return;

    return dispatch(refreshConfigs(failed)).then(() => {
      const rootState = getState();
      const fresh = rootState.otaBatch;
      const encryptActive = getEncryptActive(rootState);
      const ready = [];
      failed.forEach((deviceId) => {
        const evaluation = fresh.evaluations[deviceId];
        if (willChange(evaluation, encryptActive)) {
          ready.push(deviceId);
        } else if (evaluation && evaluation.status === "eligible") {
          // converged in the meantime (e.g. applied by another session)
          dispatch({
            type: RUN_DEVICE_STATUS,
            deviceId,
            state: "submitted",
            message: "No changes (already applied)"
          });
        } else {
          // no longer applicable (e.g. now blocked) - surface why
          dispatch({
            type: RUN_DEVICE_STATUS,
            deviceId,
            state: "error",
            message:
              evaluation && evaluation.reasons && evaluation.reasons[0]
                ? evaluation.reasons[0]
                : "Device is no longer ready"
          });
        }
      });
      if (ready.length) {
        engineRetryRun(dispatch, getState, ready).then(() =>
          refreshSubmitted(dispatch, getState, ready)
        );
      }
    });
  };
};

export const abortRun = () => {
  return function (dispatch) {
    dispatch({ type: RUN_ABORT_REQUESTED });
    engineAbortRun();
  };
};

// Full teardown when the view unmounts (navigation away, logout): a loaded
// partial and the per-device artifact cache must never survive into another
// session/bucket. Any in-flight run is invalidated (queued tasks dropped;
// in-flight PUTs were already validated against fresh data).
export const teardownView = () => {
  return function (dispatch) {
    engineInvalidateRun();
    cache.clearAll();
    dispatch({ type: RESET });
  };
};
