import * as dashboardStatusActions from "./actions";

export default (
  state = {
    mf4Objects: [],
    mf4ObjectsMin: [],
    deviceFileContents: [],
    deviceFileObjects: [],
    configObjectsUnique: [],
    configFileContents: [],
    configFileCrc32: [],
    loadedFiles: false,
    loadedConfig: false,
    loadedDevice: false,
    devicesFilesCount: 0
  },
  action
) => {
  switch (action.type) {
    case dashboardStatusActions.CLEAR_DATA_DEVICES:
      return {
        ...state,
        deviceFileContents: [],
        deviceFileObjects: [],
        configObjectsUnique: [],
        configFileContents: [],
        configFileCrc32: [],
        loadedConfig: false,
        loadedDevice: false
      };
    case dashboardStatusActions.CLEAR_DATA_FILES:
      return {
        ...state,
        mf4Objects: [],
        mf4ObjectsMin: [],
        loadedFiles: false,
        devicesFilesCount: 0
      };
    case dashboardStatusActions.SET_OBJECTS_DATA:
      return {
        ...state,
        mf4Objects: action.mf4Objects
      };
    case dashboardStatusActions.SET_DEVICES_FILES_COUNT:
      return {
        ...state,
        devicesFilesCount: action.devicesFilesCount
      };
    case dashboardStatusActions.SET_OBJECTS_DATA_MIN:
      return {
        ...state,
        mf4ObjectsMin: action.mf4ObjectsMin
      };
    case dashboardStatusActions.LOADED_FILES:
      return {
        ...state,
        loadedFiles: action.loadedFiles
      };
    case dashboardStatusActions.LOADED_CONFIG:
      return {
        ...state,
        loadedConfig: action.loadedConfig
      };
    case dashboardStatusActions.LOADED_DEVICE:
      return {
        ...state,
        loadedDevice: action.loadedDevice
      };
    case dashboardStatusActions.SET_CONFIG_OBJECTS:
      return {
        ...state,
        configObjectsUnique: action.configObjectsUnique
      };
    case dashboardStatusActions.CONFIG_FILE_CONTENT:
      return {
        ...state,
        configFileContents: action.configFileContents
      };
    case dashboardStatusActions.SET_CONFIG_FILE_CRC32:
      return {
        ...state,
        configFileCrc32: action.configFileCrc32
      };
    case dashboardStatusActions.DEVICE_FILE_CONTENT:
      return {
        ...state,
        deviceFileContents: action.deviceFileContents
      };
    case dashboardStatusActions.SET_DEVICE_FILE_OBJECT:
      return {
        ...state,
        deviceFileObjects: action.deviceFileObjects
      };
    default:
      return state;
  }
};
