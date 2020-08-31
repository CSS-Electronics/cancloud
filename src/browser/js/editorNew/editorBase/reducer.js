import * as actionsEditor from "./actions";
import _ from "lodash";

export default (
  state = {
    editorSchemaFiles: [],
    editorConfigFiles: [],
    editorUISchemaFiles: [],
    configContentPreChange: "",
    configContentLocal: {},
    formData: {},
    crc32EditorLive: ""
  },
  action
) => {
  switch (action.type) {
    case actionsEditor.SET_CRC32_EDITOR_LIVE:
      return {
        ...state,
        crc32EditorLive: action.crc32EditorLive
      };
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
   
    case actionsEditor.SET_SCHEMA_DATA:
      return {
        ...state,
        schemaContent: action.schemaContent
      };
    case actionsEditor.SET_UI_SCHEMA_DATA:
      return {
        ...state,
        uiContent: action.uiContent
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
    case actionsEditor.SET_UPDATED_FORM_DATA:
      return {
        ...state,
        formData: action.formData
      };
    default:
      return state;
  }
};