// The single encryption build step, shared by the submit run, the "New config"
// download and the confirm modal's diff view. Each call derives a FRESH
// ephemeral key, so a preview's ciphertext is never the deployed one.

import { encryptionFields, encryptionCrypto } from "config-editor-tools";

import { mergeConfig } from "./evaluate";

export const ENC_STALE =
  "Config changed on the server and can no longer be encrypted - use Retry failed to re-evaluate";
export const ENC_INVALID =
  "Encrypted config fails validation vs the device's schema";

// base = the POST-merge config object. `validator` is the submit-only gate;
// previews pass null so they inform rather than refuse.
export const buildEncryptedConfig = async (base, kpub, validator) => {
  const analysis = encryptionFields.analyzeConfigEncryption(base);
  if (!analysis.ok) {
    throw new Error(ENC_STALE);
  }

  const material = await encryptionCrypto.deriveEncryptionMaterial(kpub);
  const delta = await encryptionFields.buildEncryptedDelta(
    base,
    material.symmetricKey,
    material.serverPublicKeyBase64,
    analysis
  );

  const config = mergeConfig(base, delta);
  if (validator && !validator(config)) {
    throw new Error(ENC_INVALID);
  }
  return { config, text: JSON.stringify(config, null, 2) };
};
