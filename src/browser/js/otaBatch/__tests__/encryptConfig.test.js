// surgical crypto mock: keep the pure analyzers real, stub only the
// WebCrypto-backed functions (jsdom has no crypto.subtle)
vi.mock("config-editor-tools", async () => {
  const actual = await vi.importActual("config-editor-tools");
  return {
    ...actual,
    encryptionCrypto: {
      ...actual.encryptionCrypto,
      deriveEncryptionMaterial: vi.fn()
    },
    encryptionFields: {
      ...actual.encryptionFields,
      buildEncryptedDelta: vi.fn()
    }
  };
});

import { encryptionCrypto, encryptionFields } from "config-editor-tools";
import {
  buildEncryptedConfig,
  ENC_STALE,
  ENC_INVALID
} from "../encryptConfig";

const KPUB = "A".repeat(88);

const plainConfig = () => ({
  general: { device: { meta: "fleet-x" }, security: { kpub: "" } },
  connect: {
    s3: { server: { keyformat: 0, secretkey: "secret" } }
  }
});

// what buildEncryptedDelta would return for the config above
const delta = () => ({
  general: { security: { kpub: "NEWSERVERKEY" } },
  connect: { s3: { server: { keyformat: 1, secretkey: "Ab7Kq9ciphertext" } } }
});

beforeEach(() => {
  encryptionCrypto.deriveEncryptionMaterial.mockReset();
  encryptionFields.buildEncryptedDelta.mockReset();
  encryptionCrypto.deriveEncryptionMaterial.mockResolvedValue({
    symmetricKey: "SYMKEY",
    serverPublicKeyBase64: "NEWSERVERKEY",
    symmetricKeyBase64: "SYMKEYB64"
  });
  encryptionFields.buildEncryptedDelta.mockResolvedValue(delta());
});

describe("buildEncryptedConfig", () => {
  it("merges the delta onto the base and returns 2-space JSON", async () => {
    const base = plainConfig();
    const result = await buildEncryptedConfig(base, KPUB, null);

    expect(result.config.connect.s3.server.keyformat).toBe(1);
    expect(result.config.connect.s3.server.secretkey).toBe("Ab7Kq9ciphertext");
    expect(result.config.general.security.kpub).toBe("NEWSERVERKEY");
    expect(result.text).toBe(JSON.stringify(result.config, null, 2));
    // the base object must not be mutated - it is the shared merged-cache entry
    expect(base.connect.s3.server.keyformat).toBe(0);
  });

  it("derives the material from the device's own kpub", async () => {
    await buildEncryptedConfig(plainConfig(), KPUB, null);
    expect(encryptionCrypto.deriveEncryptionMaterial).toHaveBeenCalledWith(KPUB);
    const args = encryptionFields.buildEncryptedDelta.mock.calls[0];
    expect(args[1]).toBe("SYMKEY");
    expect(args[2]).toBe("NEWSERVERKEY");
  });

  it("throws when the base config can no longer be encrypted", async () => {
    // mixed keyformats -> analyzeConfigEncryption().ok === false
    const mixed = plainConfig();
    mixed.log = {
      encryption: { state: 1, keyformat: 1, pwd: "x".repeat(28) }
    };
    await expect(buildEncryptedConfig(mixed, KPUB, null)).rejects.toThrow(
      ENC_STALE
    );
    expect(encryptionCrypto.deriveEncryptionMaterial).not.toHaveBeenCalled();
  });

  it("throws when a submit-time validator rejects the encrypted config", async () => {
    await expect(
      buildEncryptedConfig(plainConfig(), KPUB, () => false)
    ).rejects.toThrow(ENC_INVALID);
  });

  // previews inform rather than refuse: the length gate already lives in
  // assessEncryption, so a preview is not validated
  it("skips validation entirely when no validator is passed", async () => {
    const result = await buildEncryptedConfig(plainConfig(), KPUB, null);
    expect(result.text).toContain("Ab7Kq9ciphertext");
  });

  it("passes a satisfied validator", async () => {
    const validator = vi.fn(() => true);
    const result = await buildEncryptedConfig(plainConfig(), KPUB, validator);
    expect(validator).toHaveBeenCalledWith(result.config);
  });
});
