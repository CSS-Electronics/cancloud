import * as dashboardStatusActions from "./actions";
import _ from "lodash";
import {demoMode, demoDate} from "../utils";

// initialize periodStart for first load
let periodStart = new Date();
if(demoMode){
  periodStart = new Date(demoDate);  // set fixed date for demo purposes
}
periodStart.setDate(periodStart.getDate() - 7);

export default (
  state = {
    mf4Objects: [],
    deviceLastMf4MetaData: [],
    mf4ObjectsMin: [],
    logFileMarkers: [],
    deviceFileContents: [],
    deviceFileObjects: [],
    configObjectsUnique: [],
    configFileContents: [],
    configFileCrc32: [],
    loadedFiles: false,
    loadedConfig: false,
    loadedDevice: false,
    devicesFilesCount: 0,
    periodStart: periodStart
  },
  action
) => {
  switch (action.type) {
    case dashboardStatusActions.CLEAR_DATA_DEVICES:
      return {
        ...state,
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
        deviceLastMf4MetaData: [],
        mf4ObjectsMin: [],
        logFileMarkers: [],
        loadedFiles: false,
        devicesFilesCount: 0
      };
    case dashboardStatusActions.SET_OBJECTS_DATA:
      return {
        ...state,
        mf4Objects: action.mf4Objects
      };
    case dashboardStatusActions.SET_PERIODSTART_BACK:
      let periodStart = new Date();
      if(demoMode){
        periodStart = new Date(demoDate);  // set fixed date for demo purposes
      }
      periodStart.setDate(periodStart.getDate() - action.periodDelta)
      return {
        ...state,
        periodStart: periodStart
      };
    case dashboardStatusActions.SET_LAST_OBJECT_DATA:
      return {
        ...state,
        deviceLastMf4MetaData: action.deviceLastMf4MetaData
      };
    case dashboardStatusActions.SET_DEVICES_FILES_COUNT:
      return {
        ...state,
        devicesFilesCount: action.devicesFilesCount
      };
    case dashboardStatusActions.ADD_DEVICE_MARKER:
       return {
        ...state,
        logFileMarkers: [action.logFileMarker, ...state.logFileMarkers]
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
