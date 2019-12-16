import * as actionsEditor from "./actions";
import _ from "lodash";

export default (
  state = {
    uiSchemaSource: "server",
    prevDeviceFileDevice: "",
    editorSchemaFiles: [],
    editorConfigFiles: [],
    editorUISchemaFiles: [],
    configContentPreChange: "",
    configContentLocal: {},
    deviceFileContent: {},
    deviceFileLastModified: "",
    formData: {}
  },
  action
) => {
  switch (action.type) {
    case actionsEditor.RESET_SCHEMA_FILES:
      return {
        editorSchemaFiles: [],
        editorConfigFiles: [],
        editorUISchemaFiles: []
      };
    case actionsEditor.SET_CONFIG_DATA:
      return {
        ...state,
        configContent: action.configContent
      };
    case actionsEditor.SET_PREV_DEVICE_FILE_DEVICE:
      return {
        ...state,
        prevDeviceFileDevice: action.prevDeviceFileDevice
      };

    case actionsEditor.SET_SCHEMA_DATA:
      return {
        ...state,
        schemaContent: action.schemaContent
      };
    case actionsEditor.SET_DEVICE_FILE_DATA:
      return {
        ...state,
        deviceFileContent: action.deviceFileContent
      };
    case actionsEditor.SET_DEVICE_FILE_LAST_MODIFIED:
      return {
        ...state,
        deviceFileLastModified: action.deviceFileLastModified
      };
    case actionsEditor.SET_UISCHEMA_SOURCE:
      return {
        ...state,
        uiSchemaSource: action.uiSchemaSource
      };
    case actionsEditor.SET_UI_SCHEMA_DATA:
      return {
        ...state,
        uiContent: action.uiContent
      };
    case actionsEditor.SET_UPDATED_CONFIG:
      return {
        ...state,
        configUpdate: action.configUpdate
      };
    case actionsEditor.SET_UISCHEMA_LIST:
      return {
        ...state,
        editorUISchemaFiles: _.uniqBy(
          [...state.editorUISchemaFiles, ...action.UISchemaFiles],
          "name"
        )
      };
    case actionsEditor.SET_SCHEMA_LIST:
      return {
        ...state,
        editorSchemaFiles: _.uniqBy(
          [...state.editorSchemaFiles, ...action.schemaFiles],
          "name"
        )
      };
    case actionsEditor.SET_CONFIG_LIST:
      return {
        ...state,
        editorConfigFiles: _.uniqBy(
          [...state.editorConfigFiles, ...action.configFiles],
          "name"
        )
      };
    case actionsEditor.RESET_UISCHEMA_LIST:
      return {
        ...state,
        editorUISchemaFiles: action.UISchemaFiles
      };
    case actionsEditor.RESET_LOCAL_UISCHEMA_LIST:
      return {
        ...state,
        editorUISchemaFiles: state.editorUISchemaFiles.filter(
          file => !file.name.includes("(local)")
        )
      };
    case actionsEditor.RESET_CONFIG_LIST:
      return {
        ...state,
        editorConfigFiles: action.configFiles
      };
    case actionsEditor.RESET_LOCAL_CONFIG_LIST:
      return {
        ...state,
        editorConfigFiles: state.editorConfigFiles.filter(
          file => file.name.split(".").slice(-1)[0] == "json"
        )
      };
    case actionsEditor.RESET_SCHEMA_LIST:
      return {
        ...state,
        editorSchemaFiles: action.schemaFiles
      };
    case actionsEditor.RESET_LOCAL_SCHEMA_LIST:
      return {
        ...state,
        editorSchemaFiles: state.editorSchemaFiles.filter(
          file => file.name.split(".").slice(-1)[0] == "json"
        )
      };
    case actionsEditor.RESET_UPLOADED_SCHEMA_LIST:
      return {
        ...state,
        editorSchemaFiles: state.editorSchemaFiles.filter(
          file => !file.name.includes("(local)")
        )
      };
    case actionsEditor.SET_CONFIG_DATA_PRE_CHANGE:
      return {
        ...state,
        configContentPreChange: action.configContentPreChange
      };
    case actionsEditor.SET_CONFIG_DATA_LOCAL:
      return {
        ...state,
        configContentLocal: action.configContentLocal
      };
    case actionsEditor.SET_CONFIG_NAME_PRE_CHANGE:
      return {
        ...state,
        configNamePreChange: action.configNamePreChange
      };
    case actionsEditor.SET_UPDATED_FORM_DATA:
      return {
        ...state,
        formData: action.formData
      };
    default:
      return state;
  }
};
