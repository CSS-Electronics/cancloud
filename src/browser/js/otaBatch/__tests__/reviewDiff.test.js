import { buildDeviceDiff, deviceOptionLabel } from "../reviewDiff";
import { crc32Hex } from "../cache";

const DEVICE_ID = "AABBCCDD";

const config = () => ({
  general: { device: { meta: "fleet-x" } },
  connect: { s3: { server: { keyformat: 0, secretkey: "secret" } } }
});

const deviceJson = (over) => ({
  cfg_name: "config-01.09.json",
  log_meta: "Fleet-north",
  ...(over || {})
});

// the pretty-printed form of the raw text, as the differ should see it
const pretty = (obj) => JSON.stringify(obj, null, 2);

const makeArgs = (over) => {
  const raw = pretty(config());
  return {
    deviceJson: deviceJson(),
    evaluation: {
      targetName: "config-01.09.json",
      baselineCrc32: crc32Hex(raw)
    },
    beforeText: raw,
    mergedText: pretty({ ...config(), log: { file: { split_size: 50 } } }),
    ...(over || {})
  };
};

describe("deviceOptionLabel", () => {
  it("joins config name, device id and meta", () => {
    expect(deviceOptionLabel("config-01.09.json", DEVICE_ID, "Fleet-north")).toBe(
      "config-01.09.json | AABBCCDD | Fleet-north"
    );
  });

  it("drops a blank meta rather than leaving a trailing separator", () => {
    expect(deviceOptionLabel("config-01.09.json", DEVICE_ID, "")).toBe(
      "config-01.09.json | AABBCCDD"
    );
    expect(deviceOptionLabel("config-01.09.json", DEVICE_ID, undefined)).toBe(
      "config-01.09.json | AABBCCDD"
    );
  });

  it("falls back to ? for a missing config name", () => {
    expect(deviceOptionLabel("", DEVICE_ID, "Meta")).toBe("? | AABBCCDD | Meta");
  });
});

describe("buildDeviceDiff - partial run", () => {
  it("diffs the current config against the merged text", () => {
    const args = makeArgs();
    const result = buildDeviceDiff(args);
    expect(result.status).toBe("ready");
    expect(result.afterDiffText).toBe(args.mergedText);
    expect(result.beforeName).toBe("config-01.09.json");
    expect(result.afterName).toBe("config-01.09.json");
  });

  it("labels the after side with the crc32 of the bytes that get PUT", () => {
    const args = makeArgs();
    const result = buildDeviceDiff(args);
    expect(result.afterCrc32).toBe(crc32Hex(args.mergedText));
  });

  // the crc32 must describe the file on S3, not our re-indented copy of it
  it("takes beforeCrc32 from the RAW text while diffing the normalized copy", () => {
    const raw = JSON.stringify(config(), null, 4);
    const result = buildDeviceDiff(
      makeArgs({ beforeText: raw, evaluation: { targetName: "c.json" } })
    );
    expect(result.beforeCrc32).toBe(crc32Hex(raw));
    expect(result.beforeCrc32).not.toBe(crc32Hex(pretty(config())));
    expect(result.beforeDiffText).toBe(pretty(config()));
  });

  it("normalizes a minified stored config into multiple lines", () => {
    const result = buildDeviceDiff(
      makeArgs({ beforeText: JSON.stringify(config()) })
    );
    expect(result.beforeDiffText.split("\n").length).toBeGreaterThan(1);
  });

  it("prefers the evaluation baselineCrc32 when present", () => {
    const result = buildDeviceDiff(
      makeArgs({ evaluation: { targetName: "c.json", baselineCrc32: "DEADBEEF" } })
    );
    expect(result.beforeCrc32).toBe("DEADBEEF");
  });

  it("reports unchanged when the two sides are identical", () => {
    const raw = pretty(config());
    const result = buildDeviceDiff(makeArgs({ beforeText: raw, mergedText: raw }));
    expect(result.status).toBe("unchanged");
  });

  it("does not throw on a malformed stored config", () => {
    const result = buildDeviceDiff(makeArgs({ beforeText: "{not json" }));
    expect(result.beforeDiffText).toBe("{not json");
    expect(result.status).toBe("ready");
  });

  it("reports unavailable when the config is not cached", () => {
    expect(buildDeviceDiff(makeArgs({ beforeText: undefined })).status).toBe(
      "unavailable"
    );
  });
});

describe("buildDeviceDiff - encryption run", () => {
  it("waits for the preview before showing a diff", () => {
    const result = buildDeviceDiff(makeArgs({ needsEncryption: true }));
    expect(result.status).toBe("pending");
    expect(result.afterDiffText).toBeUndefined();
  });

  it("uses the encrypted preview as the after side, over mergedText", () => {
    const encryptedText = pretty({ encrypted: true });
    const result = buildDeviceDiff(
      makeArgs({ needsEncryption: true, encryptedText })
    );
    expect(result.status).toBe("ready");
    expect(result.afterDiffText).toBe(encryptedText);
    expect(result.afterCrc32).toBe(crc32Hex(encryptedText));
  });
});

describe("buildDeviceDiff - firmware run", () => {
  it("shows the migrated config under the NEW config file name", () => {
    const result = buildDeviceDiff(
      makeArgs({
        evaluation: { targetName: "config-01.09.json", baselineCrc32: "1234ABCD" },
        deviceJson: deviceJson({ cfg_name: "config-01.08.json" })
      })
    );
    expect(result.beforeName).toBe("config-01.08.json");
    expect(result.afterName).toBe("config-01.09.json");
    expect(result.status).toBe("ready");
  });

  // patch-only firmware and TLS pushes write no config at all
  it("reports noconfig when the evaluation produced no merged text", () => {
    const result = buildDeviceDiff(makeArgs({ mergedText: undefined }));
    expect(result.status).toBe("noconfig");
    expect(result.afterDiffText).toBeUndefined();
  });
});
