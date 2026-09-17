// Before/after pair for the confirm modal's side-by-side diff. Mirrors the
// config editor's Review-changes prep: crc32 on the RAW previous text (that is
// what the device reports as cfg_crc32), but a whitespace-normalized copy fed
// to the differ - the stored file may be minified or 4-space indented, while
// everything we write is JSON.stringify(x, null, 2).

import { crc32Hex } from "./cache";

const normalize = (text) => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch (e) {
    return text;
  }
};

// "config-01.09.json | AABBCCDD | Fleet-north" - log_meta dropped when blank
export const deviceOptionLabel = (configName, deviceId, logMeta) =>
  [configName || "?", deviceId, logMeta].filter(Boolean).join(" | ");

// deviceJson/evaluation come from redux; the two texts from the module cache.
// encryptedText is the lazily built preview, required only when the run will
// encrypt this device.
export const buildDeviceDiff = ({
  deviceJson,
  evaluation,
  beforeText,
  mergedText,
  encryptedText,
  needsEncryption
}) => {
  const beforeName = (deviceJson && deviceJson.cfg_name) || "?";
  const afterName = (evaluation && evaluation.targetName) || beforeName;
  const base = {
    beforeName,
    afterName,
    beforeCrc32:
      (evaluation && evaluation.baselineCrc32) ||
      (beforeText ? crc32Hex(beforeText) : "N/A")
  };

  if (!beforeText) {
    return { ...base, status: "unavailable" };
  }
  const beforeDiffText = normalize(beforeText);

  // no merged result: a TLS push or a patch-only firmware update, neither of
  // which writes a config file
  if (!mergedText) {
    return { ...base, status: "noconfig", beforeDiffText };
  }
  if (needsEncryption && !encryptedText) {
    return { ...base, status: "pending", beforeDiffText };
  }

  const afterDiffText = needsEncryption ? encryptedText : mergedText;
  return {
    ...base,
    status: beforeDiffText === afterDiffText ? "unchanged" : "ready",
    beforeDiffText,
    afterDiffText,
    // crc32 of the exact bytes submitEngine would PUT
    afterCrc32: crc32Hex(afterDiffText)
  };
};
