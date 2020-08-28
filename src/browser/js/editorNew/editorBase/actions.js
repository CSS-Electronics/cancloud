import saveAs from "file-saver";

export const SET_SCHEMA_LIST = "editor/SET_SCHEMA_LIST";
export const SET_CONFIG_LIST = "editor/SET_CONFIG_LIST";
export const SET_UISCHEMA_LIST = "editor/SET_UISCHEMA_LIST";
export const RESET_SCHEMA_LIST = "editor/RESET_SCHEMA_LIST";
export const RESET_UISCHEMA_LIST = "editor/RESET_UISCHEMA_LIST";
export const RESET_CONFIG_LIST = "editor/RESET_CONFIG_LIST";
export const RESET_LOCAL_UISCHEMA_LIST = "editor/RESET_LOCAL_UISCHEMA_LIST";
export const RESET_LOCAL_SCHEMA_LIST = "editor/RESET_LOCAL_SCHEMA_LIST";
export const RESET_LOCAL_CONFIG_LIST = "editor/RESET_LOCAL_CONFIG_LIST";
export const SET_CONFIG_DATA = "editor/SET_CONFIG_DATA";
export const SET_UI_SCHEMA_DATA = "editor/SET_UI_SCHEMA_DATA";
export const SET_SCHEMA_DATA = "editor/SET_SCHEMA_DATA";
export const SET_UPDATED_CONFIG = "editor/SET_UPDATED_CONFIG";
export const RESET_SCHEMA_FILES = "editor/RESET_SCHEMA_FILES";
export const RESET_UPLOADED_SCHEMA_LIST = "editor/RESET_UPLOADED_SCHEMA_LIST";
export const SET_CONFIG_DATA_PRE_CHANGE = "editor/SET_CONFIG_DATA_PRE_CHANGE";
export const SET_UPDATED_FORM_DATA = "editor/SET_UPDATED_FORM_DATA";
export const SET_ACTIVE_NAV = "editor/SET_ACTIVE_NAV";
export const SET_UISCHEMA_SOURCE = "editor/SET_UISCHEMA_SOURCE";
export const SET_CONFIG_DATA_LOCAL = "SET_CONFIG_DATA_LOCAL";
export const SET_CRC32_EDITOR_LIVE = "SET_CRC32_EDITOR_LIVE";

import {
  regexUISchemaPublic,
  regexSchemaPublic,
  isValidUISchema,
  isValidSchema,
  isValidConfig,
  loadFile,
  demoMode,
  demoConfig,
  uiSchemaAry,
  schemaAry,
  crcBrowserSupport,
  getFileType,
} from "./utils";

// -------------------------------------------------------
// CRC32: Calculate checksums for comparison review of config files
export const calcCrc32EditorLive = () => {
  return function (dispatch, getState) {
    let formData = getState().editor.formData;

    if (crcBrowserSupport == 1 && formData) {
      const { crc32 } = require("crc");
      let crc32EditorLive = crc32(JSON.stringify(formData, null, 2))
        .toString(16)
        .toUpperCase()
        .padStart(8, "0");

      dispatch(setCrc32EditorLive(crc32EditorLive));
    } else {
      let crc32EditorLive = `N/A`;
      dispatch(setCrc32EditorLive(crc32EditorLive));
    }
  };
};

export const setCrc32EditorLive = (crc32EditorLive) => ({
  type: SET_CRC32_EDITOR_LIVE,
  crc32EditorLive,
});

// -------------------------------------------------------
// UISCHEMA: load the Simple/Advanced default UIschema in the online & offline editor
export const publicUiSchemaFiles = () => {
  return function (dispatch) {
    dispatch(resetUISchemaList());
    dispatch(setUISchemaFile(uiSchemaAry));
    dispatch(setUISchemaContent(loadFile(uiSchemaAry[0])));

    // If demoMode, load the Rule Schema by default for use in the online simple editor
    if (demoMode) {
      dispatch(publicSchemaFiles(demoConfig));
    }
  };
};

// fetch file content from embedded files
export const fetchFileContent = (fileName, type) => {
  return function (dispatch, getState) {

    // Remove existing "uploaded" files from dropdown and set Schema to loaded file from schema/ folder
    // Note that for cases where files are uploaded, the below is handled as part of the upload function
    switch (true) {
      case type == "uischema":
        dispatch(setConfigContentPreSubmit());
        dispatch(resetLocalUISchemaList());

        if (fileName.match(regexUISchemaPublic) != null) {
          dispatch(setUISchemaContent(loadFile(fileName)));
        } else {
          dispatch(setUISchemaContent(null));
        }

        break;
      case type == "schema":
        if (fileName.match(regexSchemaPublic) != null) {
          dispatch(setSchemaContent(loadFile(fileName)));
        } else {
          dispatch(setSchemaContent(null));
        }

        break;
      case type == "config":
        dispatch(resetLocalConfigList());

        if (fileName == "None") {
          dispatch(setConfigContent(null));
          dispatch(setUpdatedFormData(null));
          dispatch(setConfigContentPreChange(""));
        }

        break;
      case type == "config-review":
        // reload the original local config file for review purposes
        dispatch(
          setConfigContentPreChange(getState().editor.configContentLocal)
        );
        if(fileName == "None"){
          dispatch(setConfigContentPreChange(""));
        }
        break;
    }
  };
};

// handle files uploaded via the Schema Loader dropdowns
export const handleUploadedFile = (file, dropdown) => {
  let type = getFileType(dropdown);

  return function (dispatch, getState) {
    let fileReader = new FileReader();
    fileReader.onloadend = (e) => {
      const content = fileReader.result;
      let contentJSON = null;
      let fileNameDisplay = `${file.name} (local)`;
      try {
        contentJSON = JSON.parse(content);
      } catch (error) {
        window.alert(`Warning: ${file.name} is invalid and was not loaded`);
      }

      if (contentJSON != null) {
        switch (true) {
          case type == "uischema" && isValidUISchema(file.name):
            dispatch(setUISchemaContent(contentJSON));
            dispatch(resetLocalUISchemaList());
            dispatch(setUISchemaFile([fileNameDisplay]));

            break;
          case type == "schema" && isValidSchema(file.name):
            dispatch(setSchemaContent(contentJSON));
            dispatch(resetLocalSchemaList());
            dispatch(setSchemaFile([fileNameDisplay]));
            break;
          case type == "config" && isValidConfig(file.name):
            // load the matching schema files if a schema file is not already uploaded
            const localLoaded =
              getState().editor.editorSchemaFiles[0] &&
              getState().editor.editorSchemaFiles[0].name.includes("local");

            if (file && file.name && file.name.length && !localLoaded) {
              dispatch(publicSchemaFiles(file.name));
            }

            // TBD: Look intro trimming below
            dispatch(setConfigContentLocal(content));
            dispatch(setConfigContent(contentJSON));
            dispatch(resetLocalConfigList());
            dispatch(setConfigFile([fileNameDisplay]));
            dispatch(setUpdatedFormData(contentJSON));
            dispatch(setConfigContentPreChange(content));

            break;
          default:
            window.alert(`${file.name} is an invalid file/filename`);
            break;
        }
      }
    };
    fileReader.readAsText(file);
  };
};

// -------------------------------------------------------


export const resetUISchemaList = () => ({
  type: RESET_UISCHEMA_LIST,
  UISchemaFiles: [],
});

export const setUISchemaContent = (uiContent) => ({
    type: SET_UI_SCHEMA_DATA,
    uiContent,
});

export const resetLocalUISchemaList = () => ({
  type: RESET_LOCAL_UISCHEMA_LIST,
});

export const setUISchemaFile = (UISchemaFiles) => ({
  type: SET_UISCHEMA_LIST,
  UISchemaFiles: UISchemaFiles.map((file, index) => ({
    name: file,
    selected: index == 0 ? true : false,
  })),
});

// -------------------------------------------------------
// RULE SCHEMA: load the relevant Rule Schema file when a user uploads a config file (based on revision)
export const publicSchemaFiles = (selectedConfig) => {
  return function (dispatch) {
    dispatch(resetSchemaFiles());

    if (selectedConfig) {
      let schemaAryFiltered = schemaAry.filter((e) =>
        e.includes(selectedConfig.substr(7, 5))
      );

      if (demoMode) {
        schemaAryFiltered = schemaAry.filter((e) => e.includes("CANedge1"));
      }

      if (schemaAryFiltered[0]) {
        dispatch(setSchemaFile(schemaAryFiltered));
        dispatch(setSchemaContent(loadFile(schemaAryFiltered[0])));
      }
    }
  };
};

export const setSchemaFile = (schemaFiles) => ({
  type: SET_SCHEMA_LIST,
  schemaFiles: schemaFiles.map((file, index) => ({
    name: file,
    selected: index == 0 ? true : false,
  })),
});

export const resetSchemaFiles = () => ({
  type: RESET_SCHEMA_LIST,
  schemaFiles: [],
});

export const setSchemaContent = (schemaContent) => ({
  type: SET_SCHEMA_DATA,
  schemaContent,
});

export const resetFiles = () => ({
  type: RESET_SCHEMA_FILES,
  reset: true,
});

export const resetLocalSchemaList = () => ({
  type: RESET_LOCAL_SCHEMA_LIST,
});

export const resetUploadedSchemaList = () => ({
  type: RESET_UPLOADED_SCHEMA_LIST,
});

// -------------------------------------------------------
// CONFIGURATION FILE:
export const saveUpdatedConfiguration = (filename, content) => {
  return function (dispatch) {
    dispatch(setConfigContent(content));
    let blob = new Blob([JSON.stringify(content, null, 2)], {
      type: "text/json",
    });
    saveAs(blob, `${filename}`);
  };
};

export const setUpdatedFormData = (formData) => {
  return function (dispatch) {
    dispatch(setUpdatedFormDataValue(formData));
    dispatch(calcCrc32EditorLive());
  };
};

export const setUpdatedFormDataValue = (formData) => ({
    type: SET_UPDATED_FORM_DATA,
    formData,
});


export const setConfigFile = (configFiles) => ({
  type: SET_CONFIG_LIST,
  configFiles: configFiles.map((file, index) => ({
    name: file,
    selected: index == 0 ? true : false,
  })),
});

// this ensures that if the rjsf Form is reloaded (e.g. due to state change), it uses the latest formData
export const setConfigContentPreSubmit = () => {
  return function (dispatch, getState) {
    dispatch(setConfigContent(getState().editor.formData));
  };
};

// this stores the original loaded config content (before any updates are made via the Form)
export const setConfigContentPreChange = (configContentPreChange) => ({
  type: SET_CONFIG_DATA_PRE_CHANGE,
  configContentPreChange,
});

// this stores the original loaded config content from a local file
export const setConfigContentLocal = (configContentLocal) => ({
  type: SET_CONFIG_DATA_LOCAL,
  configContentLocal,
});

// this sets the config content, e.g. for use as input in the editor Form
export const setConfigContent = (configContent) => ({
  type: SET_CONFIG_DATA,
  configContent,
});

export const resetLocalConfigList = () => ({
  type: RESET_LOCAL_CONFIG_LIST,
});
