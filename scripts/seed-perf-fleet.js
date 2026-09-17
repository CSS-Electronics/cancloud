/*
 * Seeds a synthetic CANedge fleet into an S3 bucket so the OTA batch manager
 * (and the status dashboard) can be exercised at fleet scale - the real test
 * buckets hold a handful of devices, which hides anything that only shows up
 * across hundreds of rows.
 *
 * Self-contained: device.json files are synthesised and every config is
 * GENERATED from the schemas bundled with config-editor-base, so no fixture
 * files and no credentials live in this repository. The generator mirrors
 * makeCleanBaseline() in src/browser/js/otaBatch/__fixtures__/otaTestKit.js -
 * run the `validate` mode after a schema bump to confirm it still produces
 * schema-valid configs.
 *
 * USAGE
 *   node scripts/seed-perf-fleet.js <mode> [options]
 *
 *   modes
 *     list        top-level device folders currently in the bucket
 *     validate    generate every cohort's config and validate it (no writes)
 *     seed        write <id>/device.json + config-XX.XX.json + schema-XX.XX.json
 *     verify      count seeded folders/objects per cohort
 *     teardown    delete every object under the synthetic id prefix (--yes)
 *     sync        real profile: make every TRUCK device.json report what a
 *                 real device would after consuming its folder - fw_ver from a
 *                 pending firmware.bin (then deleted, as the device does),
 *                 cfg_* / sch_name for that revision, cfg_crc32 of the config
 *                 object actually in the folder, missing schema uploaded, and
 *                 a fresh Last-Modified (= heartbeat). Clears the deliberate
 *                 1-in-7 stale checksums too; re-run seed to get them back.
 *                 --dry-run prints the plan, --keep-firmware leaves firmware.bin
 *
 *   credentials (required for every mode except validate)
 *     --creds <file.json>   a CANedge configuration file (reads
 *                           connect.s3.server) or a flat JSON object
 *                           { endpoint, port, bucket, region, accessKey, secretKey }
 *     ...or the environment: S3_ENDPOINT S3_BUCKET S3_REGION S3_ACCESS_KEY
 *                            S3_SECRET_KEY [S3_PATH_STYLE=1]
 *     Keep credential files OUTSIDE this repository (or in the ignored TEMP/).
 *
 *   options
 *     --profile <name>   perf (default) or real:
 *                        perf - 200 devices, 5EED-prefixed ids, placeholder
 *                               kpub, bare generated configs, BAD cohorts
 *                        real - 30 devices that look like a real fleet:
 *                               random ids, "TRUCK 01A" metas, a REAL public
 *                               key (encryption runs work), plain-text dummy
 *                               credentials in every config, no BAD cohorts
 *     --devices <n>      how many devices to seed (default 200 / 30)
 *     --prefix <hex>     perf only: leading hex of the ids (default 5EED) -
 *                        teardown only ever touches this prefix
 *     --seed <n>         real only: PRNG seed for the random ids (fixed
 *                        default) - keep it stable so verify/teardown can
 *                        regenerate the exact same id list
 *     --concurrency <n>  parallel PUTs (default 8)
 *     --yes              required by teardown
 *
 * NOTE the perf profile's device.json carries a placeholder public key, so an
 * ENCRYPTION run against those devices fails at key import - use the real
 * profile when testing encryption. Real-profile teardown double-checks each
 * folder's device.json meta ("TRUCK ...") before deleting anything.
 */

const fs = require("fs");
const path = require("path");

const AWS = require("aws-sdk");
const Ajv = require("ajv");
const { crc32 } = require("crc");
const validatorAjv8 = require("@rjsf/validator-ajv8").default;
const { getDefaultFormState } = require("@rjsf/utils");

const SCHEMA_DIR = path.join(
  __dirname,
  "..",
  "node_modules",
  "config-editor-base",
  "dist",
  "schema"
);

// --------------------------------------------------------------------------
// arguments

const argv = process.argv.slice(2);
const MODE = argv[0];
const flag = (name, fallback) => {
  const at = argv.indexOf("--" + name);
  return at > -1 && argv[at + 1] ? argv[at + 1] : fallback;
};
const has = (name) => argv.indexOf("--" + name) > -1;

const PROFILE = String(flag("profile", "perf"));
const TOTAL = Number(flag("devices", PROFILE === "real" ? 30 : 200));
const ID_PREFIX = String(flag("prefix", "5EED")).toUpperCase();
const SEED = Number(flag("seed", 424242));
const CONCURRENCY = Number(flag("concurrency", 8));

const usage = (message) => {
  if (message) console.error("error: " + message + "\n");
  console.error(
    fs
      .readFileSync(__filename, "utf8")
      .split("*/")[0]
      .split("\n")
      .slice(1)
      .map((line) => line.replace(/^ \* ?/, ""))
      .join("\n")
  );
  process.exit(1);
};

if (!["perf", "real"].includes(PROFILE)) usage("unknown profile: " + PROFILE);

// --------------------------------------------------------------------------
// cohorts: family x revision mix, plus a few deliberately-blocked rows so the
// fleet is not uniformly "ready". Weights are shares of --devices. The real
// profile drops the BAD-* cohorts - a real fleet has consistent device.json
// files and a schema object in every folder.

const COHORTS = [
  { name: "CE2-0109", share: 0.4, family: "CANedge2", type: "0000001F", revision: "01.09", fwVer: "01.09.03" },
  { name: "CE2-0108", share: 0.2, family: "CANedge2", type: "0000001F", revision: "01.08", fwVer: "01.08.05" },
  { name: "CE2-0107", share: 0.15, family: "CANedge2", type: "0000001F", revision: "01.07", fwVer: "01.07.03" },
  { name: "CE3G-0109", share: 0.15, family: "CANedge3 GNSS", type: "0000007D", revision: "01.09", fwVer: "01.09.02" },
  { name: "CE2G-0109", share: 0.05, family: "CANedge2 GNSS", type: "0000005F", revision: "01.09", fwVer: "01.09.03" },
  // blocked: no schema object in the folder -> "Rule schema ... missing"
  { name: "BAD-noschema", share: 0.02, family: "CANedge2", type: "0000001F", revision: "01.09", fwVer: "01.09.03", skipSchemaObject: true },
  // blocked: revision outside SUPPORTED_REVISIONS
  { name: "BAD-0106", share: 0.015, family: "CANedge2", type: "0000001F", revision: "01.06", fwVer: "01.06.02" },
  // blocked: cfg_name / sch_name / cfg_ver disagree -> "device.json is inconsistent"
  { name: "BAD-triple", share: 0.015, family: "CANedge2", type: "0000001F", revision: "01.09", fwVer: "01.09.03", breakTriple: true }
];

// --------------------------------------------------------------------------
// generated, schema-valid configs (see otaTestKit.makeCleanBaseline)

const VALID_FILTER = {
  name: "f",
  state: 1,
  type: 0,
  id_format: 0,
  method: 0,
  f1: "0",
  f2: "7FF",
  prescaler_type: 0
};

const loadSchema = (family, revision) =>
  JSON.parse(
    fs.readFileSync(path.join(SCHEMA_DIR, family, "schema-" + revision + ".json"), "utf8")
  );

// the rjsf default form state is schema-DIRTY in a few deterministic places;
// fix exactly those so the result validates for every family x revision
const buildConfig = (family, revision) => {
  const schema = loadSchema(family, revision);
  const base = getDefaultFormState(validatorAjv8, schema, undefined, schema);
  if (base.rtc) {
    base.rtc.sync = 0; // "retain current time" - no required siblings
    ["manual_date_time", "message", "valid_signal", "time_signal", "tolerance", "ntp_server"].forEach(
      (key) => delete base.rtc[key]
    );
  }
  ["can_internal", "can_1", "can_2"].forEach((channel) => {
    if (base[channel] && base[channel].filter && Array.isArray(base[channel].filter.id)) {
      base[channel].filter.id = [{ ...VALID_FILTER }];
    }
  });
  if (base.gnss && base.gnss.geofence === undefined) base.gnss.geofence = [];
  return { schema, config: base };
};

// --------------------------------------------------------------------------
// real profile: a REAL public key + plain-text dummy credentials (keyformat 0)
// in every config - the fields analyzeConfigEncryption inspects, so the Sec
// column shows "plain" and an encryption run has actual work to do. The values
// are dummies; the seeding credentials are NEVER written into a config.

const REAL_KPUB =
  "Gnqt1HYCkUg+OoPOb4RlAszl0gHCgE4FWQzWdYZQBVrbStX5+sNkITpTc5RoKkTlh/ZTVQwdG3YncTWiv1Q1bQ==";

const DUMMY_S3_SERVER = {
  endpoint: "https://s3.us-east-1.amazonaws.com",
  port: 443,
  bucket: "fleet-data",
  region: "us-east-1",
  request_style: 0,
  accesskey: "FLEET0EXAMPLE0KEY",
  keyformat: 0,
  secretkey: "Fleet0Example0Secret0Key0000000000000000",
  signed_payload: 0
};

const addRealCredentials = (config, schema) => {
  const conn = config.connect;
  if (!conn) return;
  const connSchema = schema.properties.connect;

  if (conn.wifi) {
    // item defaults from the schema (covers required fields like minrssi)
    const itemSchema = connSchema.properties.wifi.properties.accesspoint.items;
    const item = getDefaultFormState(validatorAjv8, itemSchema, undefined, itemSchema);
    conn.wifi.keyformat = 0;
    conn.wifi.accesspoint = [{ ...item, ssid: "FleetWiFi", pwd: "TruckFleet2026" }];
  }
  if (conn.cellular) {
    conn.cellular.keyformat = 0;
    conn.cellular.pin = "1234";
    conn.cellular.apn = "internet";
  }

  // 01.08+ keeps s3 under the protocol dependency; 01.07 has it statically
  const dep = connSchema.dependencies && connSchema.dependencies.protocol;
  const branch = dep
    ? dep.oneOf.find((b) => b.properties.protocol.enum[0] === 0)
    : null;
  const s3Schema = branch ? branch.properties.s3 : connSchema.properties.s3;
  if (!s3Schema) return;
  const s3Block = getDefaultFormState(validatorAjv8, s3Schema, conn.s3, s3Schema);
  s3Block.server = { ...(s3Block.server || {}), ...DUMMY_S3_SERVER };
  conn.s3 = s3Block;
};

// deep schema-order sort: the config editor's rjsf form rebuilds every object
// in schema property order (incl. dependency-branch properties, appended after
// the static ones), so seeded configs must use that exact key order - or a
// one-field partial update diffs as a big reorder in the editor's review modal
const sortBySchema = (value, schema) => {
  if (!schema || typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sortBySchema(item, schema.items));
  }
  const order = [];
  const subSchemas = {};
  const collect = (s) => {
    if (!s) return;
    Object.keys(s.properties || {}).forEach((key) => {
      if (!(key in subSchemas)) {
        order.push(key);
        subSchemas[key] = s.properties[key];
      }
    });
    Object.keys(s.dependencies || {}).forEach((dep) =>
      (s.dependencies[dep].oneOf || []).forEach(collect)
    );
  };
  collect(schema);
  const sorted = {};
  order.forEach((key) => {
    if (key in value) sorted[key] = sortBySchema(value[key], subSchemas[key]);
  });
  Object.keys(value).forEach((key) => {
    if (!(key in sorted)) sorted[key] = value[key];
  });
  return sorted;
};

// what validate + seed actually use: the generated config, realised for the
// active profile and normalised to the editor's key order
const buildCohortArtifacts = (cohort) => {
  const { schema, config } = buildConfig(cohort.family, cohort.revision);
  if (PROFILE === "real") addRealCredentials(config, schema);
  return { schema, config: sortBySchema(config, schema) };
};

const crc32Hex = (text) => crc32(text).toString(16).toUpperCase().padStart(8, "0");

const deviceIdFor = (index) => {
  const width = 8 - ID_PREFIX.length;
  return ID_PREFIX + index.toString(16).toUpperCase().padStart(width, "0");
};

// deterministic PRNG (mulberry32): the real profile's random-looking ids must
// be reproducible from --seed so verify/teardown regenerate the exact id list
const mulberry32 = (a) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildIds = (count) => {
  if (PROFILE !== "real") {
    return Array.from({ length: count }, (unused, index) => deviceIdFor(index));
  }
  const rand = mulberry32(SEED);
  const ids = new Set();
  while (ids.size < count) {
    let id = "";
    for (let i = 0; i < 8; i += 1) id += "0123456789ABCDEF"[Math.floor(rand() * 16)];
    ids.add(id);
  }
  return [...ids].sort();
};

const activeCohorts = () =>
  PROFILE === "real" ? COHORTS.filter((c) => c.name.indexOf("BAD-") !== 0) : COHORTS;

// id-ordered plan: one entry per device
const buildPlan = () => {
  const cohorts = activeCohorts();
  const ids = buildIds(TOTAL);
  const plan = [];
  let index = 0;
  cohorts.forEach((cohort, position) => {
    const isLast = position === cohorts.length - 1;
    const count = isLast
      ? Math.max(TOTAL - index, 0)
      : Math.max(Math.round(TOTAL * cohort.share), 1);
    for (let n = 0; n < count && index < TOTAL; n += 1) {
      plan.push({ cohort, id: ids[index], n: index });
      index += 1;
    }
  });
  return plan;
};

const deviceJsonFor = (entry, configText) => {
  const { cohort, id, n } = entry;
  const gnss = cohort.family.indexOf("GNSS") > -1;
  const cellular = cohort.family.indexOf("CANedge3") > -1;
  // 1 in 7 reports a stale checksum -> crc-mismatch warning + red Config sync
  const crcOk = n % 7 !== 0;
  return JSON.stringify(
    {
      id,
      type: cohort.type,
      // real profile: a genuine public key so encryption runs import it fine;
      // perf profile: a placeholder of the right length (device.json validation
      // checks the length, key import only happens in an encryption run)
      kpub: PROFILE === "real" ? REAL_KPUB : "S".repeat(86) + "==",
      fw_ver: cohort.fwVer,
      hw_ver: "00.03/00.00",
      cfg_ver: cohort.breakTriple ? "01.08" : cohort.revision,
      cfg_name: "config-" + cohort.revision + ".json",
      cfg_crc32: crcOk ? crc32Hex(configText) : "DEADBEEF",
      sch_name: "schema-" + cohort.revision + ".json",
      log_meta:
        PROFILE === "real"
          ? "TRUCK " + String(n + 1).padStart(2, "0") + "ABCDEF"[n % 6]
          : "PERF " + n + " " + cohort.name,
      space_used_mb: "0/7572",
      sd_info: "0003534453413038478084EA2FBA018B",
      sd_used_lifespan: "1",
      reset_cause: "",
      wifi_fw_ver: cellular ? "" : "19.7.7/19.7.7",
      wifi_mac: cellular ? "" : "60-8A-10-C6-87-CA",
      gnss_fw_ver: gnss ? "1.00" : "",
      certs_server_sha1: []
    },
    null,
    2
  );
};

// --------------------------------------------------------------------------
// S3

const readCreds = () => {
  const file = flag("creds", null);
  if (file) {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const server =
      parsed.connect && parsed.connect.s3 && parsed.connect.s3.server
        ? parsed.connect.s3.server
        : parsed;
    return {
      endpoint: server.endpoint,
      port: server.port,
      bucket: server.bucket,
      region: server.region,
      accessKey: server.accesskey || server.accessKey,
      secretKey: server.secretkey || server.secretKey,
      pathStyle: server.request_style === 1 || server.pathStyle === true
    };
  }
  if (process.env.S3_ENDPOINT) {
    return {
      endpoint: process.env.S3_ENDPOINT,
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      pathStyle: process.env.S3_PATH_STYLE === "1"
    };
  }
  return usage("no credentials: pass --creds <file.json> or set S3_ENDPOINT etc.");
};

const makeClient = () => {
  const creds = readCreds();
  ["endpoint", "bucket", "accessKey", "secretKey"].forEach((key) => {
    if (!creds[key]) usage("credentials are missing " + key);
  });
  let endpoint = creds.endpoint;
  if (!/^https?:\/\//.test(endpoint)) endpoint = "https://" + endpoint;
  // a CANedge config keeps host and port apart (MinIO); AWS endpoints imply theirs
  if (creds.port && ![80, 443].includes(Number(creds.port)) && !/:\d+$/.test(endpoint)) {
    endpoint = endpoint + ":" + creds.port;
  }
  const s3 = new AWS.S3({
    endpoint,
    region: creds.region || "us-east-1",
    accessKeyId: creds.accessKey,
    secretAccessKey: creds.secretKey,
    s3ForcePathStyle: !!creds.pathStyle,
    signatureVersion: "v4"
  });
  // never log the keys
  console.log(
    "bucket " + creds.bucket + " @ " + endpoint + " (" + (creds.region || "us-east-1") + ")"
  );
  return { s3, bucket: creds.bucket };
};

const listAll = async (s3, bucket, prefix, delimiter) => {
  const keys = [];
  const prefixes = [];
  let token;
  do {
    const res = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: delimiter,
        ContinuationToken: token
      })
      .promise();
    (res.Contents || []).forEach((o) => keys.push(o.Key));
    (res.CommonPrefixes || []).forEach((p) => prefixes.push(p.Prefix));
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return { keys, prefixes };
};

const pool = async (items, limit, worker) => {
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        await worker(items[cursor++]);
        done += 1;
        if (done % 20 === 0) console.log("  ... " + done + "/" + items.length);
      }
    })
  );
};

// --------------------------------------------------------------------------
// modes

const modeValidate = () => {
  console.log(
    "cohort configs (generated for profile '" + PROFILE +
      "', validated against their own schema):"
  );
  let bad = 0;
  activeCohorts().forEach((cohort) => {
    const { schema, config } = buildCohortArtifacts(cohort);
    const validate = new Ajv({ allErrors: true, strict: false, logger: false }).compile(schema);
    const ok = validate(config);
    if (!ok) bad += 1;
    console.log(
      "  " +
        cohort.name.padEnd(14) +
        cohort.family.padEnd(16) +
        cohort.revision +
        "  " +
        (ok
          ? "VALID"
          : "INVALID (" +
            validate.errors.length +
            "): " +
            validate.errors
              .slice(0, 2)
              .map((e) => e.dataPath + " " + e.message)
              .join("; "))
    );
  });
  if (bad) {
    console.error(
      "\n" + bad + " cohort(s) no longer generate a valid config - the schema fix-up " +
        "in buildConfig() needs updating (compare otaTestKit.makeCleanBaseline)"
    );
    process.exit(1);
  }
};

const modeList = async () => {
  const { s3, bucket } = makeClient();
  const { prefixes } = await listAll(s3, bucket, "", "/");
  const devices = prefixes
    .map((p) => p.replace(/\/$/, ""))
    .filter((p) => /^[0-9A-Fa-f]{8}$/.test(p));
  console.log("  device folders: " + devices.length);
  console.log("  " + devices.join(" "));
  console.log(
    "  synthetic (" + ID_PREFIX + "*): " +
      devices.filter((d) => d.toUpperCase().startsWith(ID_PREFIX)).length
  );
};

const modeSeed = async () => {
  const { s3, bucket } = makeClient();
  const plan = buildPlan();
  const built = new Map();
  activeCohorts().forEach((cohort) => {
    const { schema, config } = buildCohortArtifacts(cohort);
    built.set(cohort.name, {
      configText: JSON.stringify(config, null, 2),
      schemaText: JSON.stringify(schema, null, 2)
    });
  });

  console.log(
    "seeding " + plan.length + " devices (" + plan[0].id + " ... " +
      plan[plan.length - 1].id + ")"
  );
  await pool(plan, CONCURRENCY, async (entry) => {
    const { cohort, id } = entry;
    const texts = built.get(cohort.name);
    const put = (name, body) =>
      s3
        .putObject({
          Bucket: bucket,
          Key: id + "/" + name,
          Body: body,
          ContentType: "application/json"
        })
        .promise();
    await put("device.json", deviceJsonFor(entry, texts.configText));
    await put("config-" + cohort.revision + ".json", texts.configText);
    if (!cohort.skipSchemaObject) {
      await put("schema-" + cohort.revision + ".json", texts.schemaText);
    }
  });
  console.log("done - open #/ota-batch-manager to see the fleet");
};

// all object keys belonging to the plan's folders (the real profile has no
// shared id prefix, so it lists per device folder)
const listPlanKeys = async (s3, bucket, plan) => {
  if (PROFILE !== "real") {
    return (await listAll(s3, bucket, ID_PREFIX, undefined)).keys;
  }
  const keys = [];
  for (const entry of plan) {
    keys.push(...(await listAll(s3, bucket, entry.id + "/", undefined)).keys);
  }
  return keys;
};

const modeVerify = async () => {
  const { s3, bucket } = makeClient();
  const plan = buildPlan();
  const keys = await listPlanKeys(s3, bucket, plan);
  const perFolder = {};
  keys.forEach((key) => {
    // count only the folder-root artifacts (device.json/config/schema) - log
    // file sessions live in subfolders and are not this script's concern
    if (key.split("/").length !== 2) return;
    const folder = key.split("/")[0];
    perFolder[folder] = (perFolder[folder] || 0) + 1;
  });
  console.log("  folders: " + Object.keys(perFolder).length + " / " + plan.length);
  console.log("  objects: " + keys.length);
  const counts = {};
  plan.forEach((entry) => {
    const expected = entry.cohort.skipSchemaObject ? 2 : 3;
    const label = entry.cohort.name + ((perFolder[entry.id] || 0) === expected ? " ok" : " MISMATCH");
    counts[label] = (counts[label] || 0) + 1;
  });
  Object.keys(counts).forEach((label) => console.log("    " + label.padEnd(22) + counts[label]));
};

const modeTeardown = async () => {
  if (PROFILE !== "real" && !/^[0-9A-F]{2,7}$/.test(ID_PREFIX)) {
    usage("refusing to delete: --prefix must be 2-7 hex characters");
  }
  const { s3, bucket } = makeClient();
  const scope = PROFILE === "real" ? "the seeded TRUCK fleet" : ID_PREFIX + "*";

  let keys;
  if (PROFILE === "real") {
    // no shared prefix: walk the regenerated plan, and only touch folders
    // whose device.json carries the profile's meta marker - a random id can
    // never make teardown delete a folder this script did not seed
    keys = [];
    for (const entry of buildPlan()) {
      const folderKeys = (await listAll(s3, bucket, entry.id + "/", undefined)).keys;
      if (!folderKeys.length) continue;
      let meta = null;
      try {
        const res = await s3
          .getObject({ Bucket: bucket, Key: entry.id + "/device.json" })
          .promise();
        meta = JSON.parse(res.Body.toString()).log_meta;
      } catch (e) {}
      if (typeof meta === "string" && meta.indexOf("TRUCK ") === 0) {
        keys.push(...folderKeys);
      } else {
        console.log("  skipping " + entry.id + " (no TRUCK device.json - not ours)");
      }
    }
  } else {
    keys = (await listAll(s3, bucket, ID_PREFIX, undefined)).keys;
  }

  if (!keys.length) {
    console.log("  nothing to delete for " + scope);
    return;
  }
  if (!has("yes")) {
    console.log(
      "  would delete " + keys.length + " objects (" + scope +
        ") - re-run with --yes to confirm"
    );
    return;
  }
  console.log("  deleting " + keys.length + " objects (" + scope + ")");
  for (let i = 0; i < keys.length; i += 1000) {
    await s3
      .deleteObjects({
        Bucket: bucket,
        Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true }
      })
      .promise();
    console.log("  ... " + Math.min(i + 1000, keys.length) + "/" + keys.length);
  }
  console.log("  remaining: " + (await listPlanKeys(s3, bucket, buildPlan())).length);
};

// --------------------------------------------------------------------------
// sync: device.json follows the folder (see usage). Family is needed to upload
// a schema the device would have pushed itself after a firmware update.

const TYPE_FAMILY = {
  "0000001F": "CANedge2",
  "0000005F": "CANedge2 GNSS",
  "0000007D": "CANedge3 GNSS"
};

// firmware.bin header: bytes 0-3 magic -> family, bytes 4-6 -> major.minor.patch
const FW_MAGIC_FAMILY = {
  DEAD10CC: "CANedge1",
  "0F4947CF": "CANedge1 GNSS",
  BAADA555: "CANedge2",
  "7FD43111": "CANedge2 GNSS",
  E670C727: "CANedge3",
  B74D1858: "CANedge3 GNSS"
};

const parseFirmwareHeader = (buffer) => ({
  family: FW_MAGIC_FAMILY[buffer.slice(0, 4).toString("hex").toUpperCase()] || null,
  fwVer: [buffer[4], buffer[5], buffer[6]].map((n) => String(n).padStart(2, "0")).join(".")
});

const getText = async (s3, bucket, key) =>
  (await s3.getObject({ Bucket: bucket, Key: key }).promise()).Body.toString();

// what one device folder should report; null when nothing can be decided
const planSync = async (s3, bucket, id) => {
  const rootKeys = (await listAll(s3, bucket, id + "/", "/")).keys.map((k) => k.slice(id.length + 1));
  if (!rootKeys.includes("device.json")) return { id, skip: "no device.json" };
  const deviceJson = JSON.parse(await getText(s3, bucket, id + "/device.json"));
  if (typeof deviceJson.log_meta !== "string" || deviceJson.log_meta.indexOf("TRUCK ") !== 0) {
    return { id, skip: "not a TRUCK device - not ours" };
  }
  const family = TYPE_FAMILY[deviceJson.type];
  if (!family) return { id, skip: "unknown device type " + deviceJson.type };

  let fwVer = deviceJson.fw_ver;
  const hasFirmware = rootKeys.includes("firmware.bin");
  if (hasFirmware) {
    const head = await s3
      .getObject({ Bucket: bucket, Key: id + "/firmware.bin", Range: "bytes=0-15" })
      .promise();
    const fw = parseFirmwareHeader(head.Body);
    if (fw.family !== family) {
      return { id, skip: "firmware.bin is for " + fw.family + ", device is " + family };
    }
    fwVer = fw.fwVer;
  }
  const revision = fwVer.slice(0, 5);
  const cfgName = "config-" + revision + ".json";
  const schName = "schema-" + revision + ".json";
  if (!rootKeys.includes(cfgName)) {
    return { id, skip: cfgName + " missing in folder (device on " + fwVer + ")" };
  }
  const crc = crc32Hex(await getText(s3, bucket, id + "/" + cfgName));

  const next = {
    ...deviceJson,
    fw_ver: fwVer,
    cfg_ver: revision,
    cfg_name: cfgName,
    cfg_crc32: crc,
    sch_name: schName
  };
  const changed = Object.keys(next).filter((key) => next[key] !== deviceJson[key]);
  return {
    id,
    family,
    revision,
    deviceJson: next,
    changed,
    uploadSchema: !rootKeys.includes(schName),
    deleteFirmware: hasFirmware && !has("keep-firmware")
  };
};

const modeSync = async () => {
  if (PROFILE !== "real") usage("sync only applies to --profile real (TRUCK fleet)");
  const dryRun = has("dry-run");
  const { s3, bucket } = makeClient();
  const { prefixes } = await listAll(s3, bucket, "", "/");
  const ids = prefixes.map((p) => p.replace(/\/$/, "")).filter((p) => /^[0-9A-F]{8}$/i.test(p));

  const plans = [];
  for (const id of ids) plans.push(await planSync(s3, bucket, id));

  const bundledSchemas = {};
  const schemaTextFor = (family, revision) => {
    const key = family + "/" + revision;
    if (!bundledSchemas[key]) {
      bundledSchemas[key] = JSON.stringify(loadSchema(family, revision), null, 2);
    }
    return bundledSchemas[key];
  };

  let touched = 0;
  for (const plan of plans) {
    if (plan.skip) {
      console.log("  " + plan.id + "  skip: " + plan.skip);
      continue;
    }
    const actions = ["device.json" + (plan.changed.length ? " (" + plan.changed.join(", ") + ")" : " (heartbeat only)")];
    if (plan.uploadSchema) actions.push("+ schema-" + plan.revision + ".json");
    if (plan.deleteFirmware) actions.push("- firmware.bin");
    console.log("  " + plan.id + "  " + plan.deviceJson.log_meta.padEnd(9) + " " + actions.join("  "));
    if (dryRun) continue;

    const put = (name, body) =>
      s3
        .putObject({ Bucket: bucket, Key: plan.id + "/" + name, Body: body, ContentType: "application/json" })
        .promise();
    if (plan.uploadSchema) await put("schema-" + plan.revision + ".json", schemaTextFor(plan.family, plan.revision));
    await put("device.json", JSON.stringify(plan.deviceJson, null, 2));
    if (plan.deleteFirmware) {
      await s3.deleteObject({ Bucket: bucket, Key: plan.id + "/firmware.bin" }).promise();
    }
    touched += 1;
  }
  console.log(dryRun ? "dry run - nothing written" : "synced " + touched + " device folders");
};

const MODES = {
  list: modeList,
  validate: async () => modeValidate(),
  seed: modeSeed,
  verify: modeVerify,
  teardown: modeTeardown,
  sync: modeSync
};

if (!MODES[MODE]) usage(MODE ? "unknown mode: " + MODE : null);
MODES[MODE]().catch((e) => {
  console.error("failed: " + e.message);
  process.exit(1);
});
