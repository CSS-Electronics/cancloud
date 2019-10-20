import * as actionsEditorTools from "./actions";

export default (
  state = {
    encryptionSidebarOpen: false,
    filterSidebarOpen: false,
    bitRateSidebarOpen: false,
    partialConfigLoaderSidebarOpen: false,
    crc32EditorLive: "",
    crc32EditorPre: "",
    deviceFileTableOpen: false,
    editorSchemaSidebarOpen: false,
    crcSidebarOpen: false,
    devicePublicKey: "",
    serverPublicKeyBase64: "",
    symmetricKeyBase64: "",
    symmetricKey: "",
    fieldValueEncryptedBase64: ""
  },
  action
) => {
  switch (action.type) {
    case actionsEditorTools.CLOSE_EDITOR_SIDEBARS:
      return Object.assign({}, state, {
        deviceFileTableOpen: false,
        encryptionSidebarOpen: false,
        crcSidebarOpen: false,
        editorSchemaSidebarOpen: false,
        filterSidebarOpen: false,
        bitRateSidebarOpen: false,
        partialConfigLoaderSidebarOpen: false
      });
    case actionsEditorTools.TOGGLE_ENCRYPTION_SIDEBAR:
      return Object.assign({}, state, {
        encryptionSidebarOpen: !state.encryptionSidebarOpen
      });
    case actionsEditorTools.TOGGLE_BITRATE_SIDEBAR:
      return Object.assign({}, state, {
        bitRateSidebarOpen: !state.bitRateSidebarOpen
      });
    case actionsEditorTools.TOGGLE_PARTIAL_CONFIG_LOADER_SIDEBAR:
      return Object.assign({}, state, {
        partialConfigLoaderSidebarOpen: !state.partialConfigLoaderSidebarOpen
      });
    case actionsEditorTools.TOGGLE_DEVICE_FILE_TABLE:
      return Object.assign({}, state, {
        deviceFileTableOpen: !state.deviceFileTableOpen
      });
    case actionsEditorTools.TOGGLE_CRC_SIDEBAR:
      return Object.assign({}, state, {
        crcSidebarOpen: !state.crcSidebarOpen
      });
    case actionsEditorTools.TOGGLE_SCHEMA_SIDEBAR:
      return Object.assign({}, state, {
        editorSchemaSidebarOpen: !state.editorSchemaSidebarOpen
      });
    case actionsEditorTools.TOGGLE_FILTER_SIDEBAR:
      return Object.assign({}, state, {
        filterSidebarOpen: !state.filterSidebarOpen
      });
    case actionsEditorTools.OPEN_DEVICE_FILE_TABLE:
      return Object.assign({}, state, {
        deviceFileTableOpen: true
      });
    case actionsEditorTools.SET_CRC32_EDITOR_LIVE:
      return {
        ...state,
        crc32EditorLive: action.crc32EditorLive
      };
    case actionsEditorTools.SET_CRC32_EDITOR_PRE:
      return {
        ...state,
        crc32EditorPre: action.crc32EditorPre
      };
    case actionsEditorTools.SET_DEVICE_PUBLIC_KEY:
      return {
        ...state,
        devicePublicKey: action.devicePublicKey
      };
    case actionsEditorTools.SET_SERVER_PUBLIC_KEY:
      return {
        ...state,
        serverPublicKeyBase64: action.serverPublicKeyBase64
      };
    case actionsEditorTools.SET_SERVER_SECRET_KEY:
      return {
        ...state,
        serverSecretKey: action.serverSecretKey
      };
    case actionsEditorTools.SET_SYMMETRIC_KEY_BASE64:
      return {
        ...state,
        symmetricKeyBase64: action.symmetricKeyBase64
      };
    case actionsEditorTools.SET_SYMMETRIC_KEY:
      return {
        ...state,
        symmetricKey: action.symmetricKey
      };
    case actionsEditorTools.SET_ENCRYPTED_FIELD:
      return {
        ...state,
        fieldValueEncryptedBase64: action.fieldValueEncryptedBase64
      };
    default:
      return state;
  }
};
