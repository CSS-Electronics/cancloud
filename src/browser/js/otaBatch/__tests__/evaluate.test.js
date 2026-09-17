import {
  analyzePartial,
  evaluateDevice,
  classifyCurrentEncryption
} from "../evaluate";
import * as cache from "../cache";

// self-contained CANedge-like schema (real schemas are exercised in e2e);
// root additionalProperties:false makes schema-validation blocks testable
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["general", "log", "can_1", "can_2"],
  properties: {
    general: {
      type: "object",
      properties: {
        device: { type: "object", properties: { meta: { type: "string" } } },
        security: { type: "object", properties: { kpub: { type: "string" } } }
      }
    },
    log: { type: "object" },
    can_1: { type: "object" },
    can_2: { type: "object" },
    connect: {
      type: "object",
      properties: {
        wifi: {
          type: "object",
          properties: {
            keyformat: { type: "integer", enum: [0, 1] },
            accesspoint: { type: "array" }
          }
        },
        s3: { type: "object" }
      }
    }
  }
};

const DEVICE_ID = "AABBCCDD";

const baseConfig = () => ({
  general: { device: { meta: "fleet-x" }, security: { kpub: "" } },
  log: { file: { split_size: 10, split_time_period: 60, split_time_offset: 0 } },
  can_1: { phy: { mode: 0 }, transmit: [], filter: { id: [{ name: "f1", state: 1 }] } },
  can_2: { phy: { mode: 0 }, transmit: [], filter: { id: [{ name: "f1", state: 1 }] } },
  connect: {
    wifi: { keyformat: 0, accesspoint: [{ ssid: "net", pwd: "pass" }] },
    s3: {
      server: {
        endpoint: "http://s3.example.com",
        port: 80,
        keyformat: 0,
        secretkey: "secret"
      }
    }
  }
});

// a config with no encryptable credential sections at all
const noCredConfig = () => ({
  general: { device: { meta: "fleet-x" }, security: { kpub: "" } },
  log: { file: { split_size: 10, split_time_period: 60, split_time_offset: 0 } },
  can_1: { phy: { mode: 0 }, transmit: [], filter: { id: [{ name: "f1", state: 1 }] } },
  can_2: { phy: { mode: 0 }, transmit: [], filter: { id: [{ name: "f1", state: 1 }] } }
});

const baseDeviceJson = () => ({
  id: DEVICE_ID,
  type: "0000001F", // CANedge2
  kpub: "A".repeat(88),
  fw_ver: "01.09.01",
  cfg_ver: "01.09",
  cfg_name: "config-01.09.json",
  sch_name: "schema-01.09.json",
  cfg_crc32: "",
  log_meta: "my-device"
});

const makeInput = ({ config, deviceJson, partial } = {}) => {
  const conf = config || baseConfig();
  const text = JSON.stringify(conf, null, 2);
  const crc = cache.crc32Hex(text);

  cache.clearAll();
  cache.setSchema(DEVICE_ID, JSON.stringify(SCHEMA));

  const analysis = partial ? analyzePartial(partial, []) : { facts: null };

  return {
    deviceId: DEVICE_ID,
    deviceJson: { ...baseDeviceJson(), cfg_crc32: crc, ...(deviceJson || {}) },
    heartbeatMs: Date.now(),
    nowMs: Date.now(),
    config: { data: { text, parsed: conf }, meta: { status: "loaded", crc32: crc } },
    schemaStatus: "loaded",
    validator: cache.getValidator(DEVICE_ID),
    partial,
    facts: analysis.facts
  };
};

describe("analyzePartial (batch-level gates)", () => {
  it("blocks empty / non-object partials", () => {
    expect(analyzePartial({}, []).blockers.length).toBe(1);
    expect(analyzePartial(null, []).blockers.length).toBe(1);
    expect(analyzePartial([1, 2], []).blockers.length).toBe(1);
  });

  it("blocks a non-empty kpub anywhere (device-specific key broadcast)", () => {
    const { blockers } = analyzePartial(
      { general: { security: { kpub: "SOMEKEY" } } },
      []
    );
    expect(blockers.some((b) => b.includes("device-specific"))).toBe(true);
  });

  it("blocks keyformat: 1 anywhere (encrypted credential broadcast)", () => {
    const { blockers } = analyzePartial(
      { connect: { s3: { server: { keyformat: 1, secretkey: "abc==" } } } },
      []
    );
    expect(blockers.length).toBeGreaterThan(0);
  });

  it("blocks webserver security: 2", () => {
    const { blockers } = analyzePartial(
      { connect: { webserver: { security: 2, password: "abc==" } } },
      []
    );
    expect(blockers.length).toBeGreaterThan(0);
  });

  it("notes (not blocks) kpub clearing and meta broadcast + deletions", () => {
    const { blockers, notes } = analyzePartial(
      { general: { security: { kpub: "" }, device: { meta: "same-name" } } },
      ["can_1.filter.f9"]
    );
    expect(blockers).toEqual([]);
    expect(notes.length).toBe(3);
  });

  it("passes a plain S3 endpoint partial", () => {
    const { blockers, notes } = analyzePartial(
      { connect: { s3: { server: { endpoint: "https://new", port: 443 } } } },
      []
    );
    expect(blockers).toEqual([]);
    expect(notes).toEqual([]);
  });
});

describe("evaluateDevice - partial merge", () => {
  it("eligible + change: valid partial merges, validates, collects warnings", () => {
    // https + port 80 in the merged config triggers the editor's TLS warning
    const input = makeInput({
      partial: { connect: { s3: { server: { endpoint: "https://new-host" } } } }
    });
    const result = evaluateDevice(input);
    expect(result.status).toBe("eligible");
    expect(result.eligible).toBe(true);
    expect(result.partialChanges).toBe(true);
    expect(result.targetName).toBe("config-01.09.json");
    expect(result.baselineCrc32).toBe(input.config.meta.crc32);
    expect(result.merged.connect.s3.server.endpoint).toBe("https://new-host");
    expect(result.warnings.some((w) => w.includes("TLS"))).toBe(true);
  });

  it("blocked: merged config fails the device's own schema", () => {
    const input = makeInput({ partial: { gnss: { mode: 1 } } });
    const result = evaluateDevice(input);
    expect(result.status).toBe("blocked");
    expect(result.reasons[0]).toContain("fails validation");
  });

  it("eligible + no change: merged text equals the current config text", () => {
    const input = makeInput({
      partial: { connect: { s3: { server: { port: 80 } } } }
    });
    const result = evaluateDevice(input);
    expect(result.status).toBe("eligible");
    expect(result.partialChanges).toBe(false);
    // still eligible because the plain credentials are encryptable
    expect(result.eligible).toBe(true);
  });

  it("blocked: device.json id does not match the folder", () => {
    const input = makeInput({
      deviceJson: { id: "11223344" },
      partial: { general: { device: { meta: "x" } } }
    });
    const result = evaluateDevice(input);
    expect(result.status).toBe("blocked");
    expect(result.reasons[0]).toContain("does not match the folder");
  });

  it("blocked: unsupported revision", () => {
    const input = makeInput({
      deviceJson: {
        cfg_name: "config-01.06.json",
        sch_name: "schema-01.06.json",
        cfg_ver: "01.06"
      },
      partial: { general: { device: { meta: "x" } } }
    });
    const result = evaluateDevice(input);
    expect(result.status).toBe("blocked");
    expect(result.reasons[0]).toContain("not supported");
  });

  it("blocked: inconsistent device.json revisions (mid-update)", () => {
    const input = makeInput({
      deviceJson: { sch_name: "schema-01.08.json" },
      partial: { general: { device: { meta: "x" } } }
    });
    const result = evaluateDevice(input);
    expect(result.status).toBe("blocked");
    expect(result.reasons[0]).toContain("inconsistent");
  });

  it("blocked: config file missing in the folder", () => {
    const input = makeInput({ partial: { general: { device: { meta: "x" } } } });
    input.config = { data: undefined, meta: { status: "missing" } };
    const result = evaluateDevice(input);
    expect(result.status).toBe("blocked");
    expect(result.reasons[0]).toContain("not found in the device folder");
  });

  it("blocked: schema missing in the folder", () => {
    const input = makeInput({ partial: { general: { device: { meta: "x" } } } });
    input.schemaStatus = "missing";
    input.validator = null;
    const result = evaluateDevice(input);
    expect(result.status).toBe("blocked");
    expect(result.reasons[0]).toContain("Rule schema");
  });

  it("pending while artifacts are loading", () => {
    const input = makeInput({ partial: { general: { device: { meta: "x" } } } });
    input.config = { data: undefined, meta: { status: "loading" } };
    expect(evaluateDevice(input).status).toBe("pending");
  });

  it("blocked (strict guard): plaintext credential over an encrypted section", () => {
    const config = baseConfig();
    config.general.security.kpub = "B".repeat(88);
    config.connect.wifi.keyformat = 1;
    config.connect.wifi.accesspoint[0].pwd = "ZW5jcnlwdGVk==";
    const input = makeInput({
      config,
      partial: { connect: { wifi: { accesspoint: [{ ssid: "n", pwd: "plain" }] } } }
    });
    const result = evaluateDevice(input);
    expect(result.status).toBe("blocked");
    expect(result.reasons[0]).toContain("expects it encrypted");
  });

  it("blocked (D10): flips to plain without providing the value", () => {
    const config = baseConfig();
    config.general.security.kpub = "B".repeat(88);
    config.connect.wifi.keyformat = 1;
    const input = makeInput({
      config,
      partial: { connect: { wifi: { keyformat: 0 } } }
    });
    const result = evaluateDevice(input);
    expect(result.status).toBe("blocked");
    expect(result.reasons[0]).toContain("does not provide the password value");
  });

  it("eligible: fleet-wide de-encryption with values provided", () => {
    const config = baseConfig();
    config.general.security.kpub = "B".repeat(88);
    config.connect.wifi.keyformat = 1;
    config.connect.s3.server.keyformat = 1;
    const input = makeInput({
      config,
      partial: {
        general: { security: { kpub: "" } },
        connect: {
          wifi: { keyformat: 0, accesspoint: [{ ssid: "n", pwd: "plain" }] },
          s3: { server: { keyformat: 0, secretkey: "plainsecret" } }
        }
      }
    });
    const result = evaluateDevice(input);
    expect(result.status).toBe("eligible");
    expect(result.partialChanges).toBe(true);
  });

  it("blocked (D14): clearing kpub while encrypted sections remain", () => {
    const config = baseConfig();
    config.general.security.kpub = "B".repeat(88);
    config.connect.wifi.keyformat = 1;
    const input = makeInput({
      config,
      partial: { general: { security: { kpub: "" } } }
    });
    const result = evaluateDevice(input);
    expect(result.status).toBe("blocked");
    expect(result.reasons[0]).toContain("could not decrypt");
  });

  it("non-credential partials pass over an encrypted fleet", () => {
    const config = baseConfig();
    config.general.security.kpub = "B".repeat(88);
    config.connect.wifi.keyformat = 1;
    const input = makeInput({
      config,
      partial: { connect: { s3: { server: { endpoint: "http://other", port: 9000 } } } }
    });
    const result = evaluateDevice(input);
    expect(result.status).toBe("eligible");
    expect(result.partialChanges).toBe(true);
  });
});

describe("evaluateDevice - encryption assessment (post-merge)", () => {
  it("plain credentials: encryptable", () => {
    const result = evaluateDevice(makeInput({}));
    expect(result.status).toBe("eligible");
    expect(result.eligible).toBe(true); // encryptable even with no partial
    expect(result.enc.hasPlain).toBe(true);
    expect(result.enc.compatible).toBe(true);
    // the per-field summary fed a confirm-modal accordion replaced by the diff
    // view; dropping it also drops a summarizeDelta call per device
    expect(result.enc.summary).toBeUndefined();
  });

  // a blank SIM PIN cannot be encrypted, but leaving it plain is a no-op - the
  // warning was noise in both the table and the confirm modal
  it("blank SIM PIN: no warning, but other blank credentials still warn", () => {
    const config = baseConfig();
    config.connect.cellular = { keyformat: 0, pin: "" };
    config.connect.s3.server.secretkey = "";
    const result = evaluateDevice(makeInput({ config }));
    expect(result.enc.hasPlain).toBe(true);
    expect(result.enc.warnings.join(" ")).not.toMatch(/SIM PIN/);
    expect(result.enc.warnings.join(" ")).toMatch(
      /Blank password will be encrypted: connect\.s3\.server\.secretkey/
    );
  });

  it("invalid kpub: has plaintext but not encrypt-compatible", () => {
    const result = evaluateDevice(makeInput({ deviceJson: { kpub: "tooshort" } }));
    expect(result.enc.hasPlain).toBe(true);
    expect(result.enc.compatible).toBe(false);
    expect(result.enc.reason).toContain("kpub");
  });

  it("all encrypted: nothing to encrypt, not eligible without a partial", () => {
    const config = baseConfig();
    config.general.security.kpub = "B".repeat(88);
    config.connect.wifi.keyformat = 1;
    config.connect.s3.server.keyformat = 1;
    const result = evaluateDevice(makeInput({ config }));
    expect(result.enc.hasPlain).toBe(false);
    expect(result.eligible).toBe(false);
    expect(result.currentEncStatus).toBe("encrypted");
  });

  it("mixed formats post-merge: has plaintext but incompatible", () => {
    const config = baseConfig();
    config.general.security.kpub = "B".repeat(88);
    config.connect.wifi.keyformat = 1; // s3 stays plain -> mixed
    const result = evaluateDevice(makeInput({ config }));
    expect(result.enc.hasPlain).toBe(true);
    expect(result.enc.compatible).toBe(false);
    expect(result.enc.reason).toContain("encrypted while others are plain");
    expect(result.currentEncStatus).toBe("mixed");
  });

  it("a partial can make a mixed device encryptable post-merge", () => {
    const config = baseConfig();
    config.general.security.kpub = "B".repeat(88);
    config.connect.wifi.keyformat = 1; // currently mixed (s3 plain)
    // partial sets wifi to plain with a value -> post-merge all plain
    const input = makeInput({
      config,
      partial: {
        connect: { wifi: { keyformat: 0, accesspoint: [{ ssid: "n", pwd: "p" }] } }
      }
    });
    const result = evaluateDevice(input);
    expect(result.currentEncStatus).toBe("mixed"); // the CURRENT config
    expect(result.enc.compatible).toBe(true); // the POST-merge config
    expect(result.enc.hasPlain).toBe(true);
  });
});

describe("classifyCurrentEncryption", () => {
  it("classifies the current config into the four lock states", () => {
    const plain = baseConfig();
    expect(classifyCurrentEncryption(plain)).toBe("plain");

    const encrypted = baseConfig();
    encrypted.connect.wifi.keyformat = 1;
    encrypted.connect.s3.server.keyformat = 1;
    expect(classifyCurrentEncryption(encrypted)).toBe("encrypted");

    const mixed = baseConfig();
    mixed.connect.wifi.keyformat = 1; // s3 stays plain
    expect(classifyCurrentEncryption(mixed)).toBe("mixed");

    expect(classifyCurrentEncryption(noCredConfig())).toBe("none");
  });
});
