import * as dashboardStatusActions from "./actions";

export default (
  state = {
    objectsData: {},
    deviceFileContents: [],
    deviceFileObjects: [],
    configObjectsUnique: [],
    configFileContents: [],
    configFileCrc32: [],
    loaded:false
  },
  action
) => {
  switch (action.type) {
    case dashboardStatusActions.SET_OBJECTS_DATA:
      return {
        ...state,
        objectsData: action.objectsData
      };
    case dashboardStatusActions.LOADED_ALL:
        return {
          ...state,
          loaded: action.loaded
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
