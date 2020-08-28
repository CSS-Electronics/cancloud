// -------------------------------------------------------
// UTILS: Utils for testing schema name validity

// Toggle demo mode on/off
export const demoMode = false;
export const demoConfig = "config-01.02.json" 

// Note: These need to be updated with future firmware revisions
export const uiSchemaAry = [
  "uischema-01.02.json | Simple",
  "uischema-01.02.json | Advanced",
];

export const schemaAry = [
  "schema-01.02.json | CANedge2",
  "schema-01.02.json | CANedge1",
  "schema-01.02.json | CANedge2",
  "schema-01.02.json | CANedge1",
  "schema-00.07.json | CANedge2",
  "schema-00.07.json | CANedge1",
];

export const regexUISchemaPublic = new RegExp(
  /^uischema-\d{2}\.\d{2}\.json \| (Advanced|Simple)$/,
  "g"
);

export const regexSchemaPublic = new RegExp(
  /^schema-\d{2}\.\d{2}\.json \| CANedge(1|2)$/,
  "g"
);

export const isValidUISchema = (file) => {
  const regexUiSchema = new RegExp(
    "uischema-\\d{2}\\.\\d{2}\\.json",
    "g"
  );
  return regexUiSchema.test(file);
};

export const isValidSchema = (file) => {
  const regexSchema = new RegExp(
    "schema-\\d{2}\\.\\d{2}\\.json",
    "g"
  );
  return regexSchema.test(file);
};

export const isValidConfig = (file) => {
  const regexConfig = new RegExp(
    "config-\\d{2}\\.\\d{2}\\.json",
    "g"
  );
  return regexConfig.test(file);
};

export const getFileType = (dropdown) => {
  let type = ""
  switch (true) {
    case dropdown == "Presentation Mode":
      type = "uischema"
      break;
    case dropdown == "Rule Schema":
      type = "schema"
      break;
    case dropdown == "Configuration File":
      type = "config"
      break;
    case dropdown == "Previous Configuration File":
      type = "config-review"
      break;
    default:
      type = "invalid"
  }
  return type
}

export const loadFile = (fileName) => {
  const schema = require(`./schema/${
    fileName.split(" | ")[1]
  }/${fileName.split(" ")[0]}`);

  return schema;
}


// CRC32: Calculate crc32 of Configuration File
const { detect } = require("detect-browser");
const browser = detect();

export const crcBrowserSupport = [
  "chrome",
  "firefox",
  "opera",
  "safari",
  "edge",
].includes(browser.name);