import web from "../web";
import * as alertActions from "../alert/actions";
import * as commonActions from "../browser/actions";
import _ from "lodash";
export const SET_OBJECTS_DATA = "dashboardStatus/OBJECTS_RESULT";
export const DEVICE_FILE_CONTENT = "dashboardStatus/DEVICE_FILE_CONTENT";
export const SET_DEVICE_FILE_OBJECT = "dashboardStatus/SET_DEVICE_FILE_OBJECT";
export const SET_CONFIG_OBJECTS = "dashboardStatus/SET_CONFIG_OBJECTS";
export const CONFIG_FILE_CONTENT = "dashboardStatus/CONFIG_FILE_CONTENT";
export const SET_CONFIG_FILE_CRC32 = "dashboardStatus/SET_CONFIG_FILE_CRC32";
export const SET_UPLOADED_SIZE_TOTAL =
  "dashboardStatus/SET_UPLOADED_SIZE_TOTAL";
export const LOADED_FILES = "dashboardStatus/LOADED_FILES";
export const LOADED_CONFIG = "dashboardStatus/LOADED_CONFIG";
export const LOADED_DEVICE = "dashboardStatus/LOADED_DEVICE";
export const CLEAR_DATA = "dashboardStatus/CLEAR_DATA";

const { crc32 } = require("crc");
let crc32Val = "";

const loggerRegex = new RegExp(/([0-9A-Fa-f]){8}/);
const loggerConfigRegex = new RegExp(
  /^([0-9A-Fa-f]){8}\/config-[0-9]{2}.[0-9]{2}.json/,
  "g"
);

let periodStart = new Date(); // get current date & time
let periodDaysMax = 30; // all objects before this period are excluded
periodStart.setDate(periodStart.getDate() - periodDaysMax);


export const listAllObjects = () => {
  return function(dispatch, getState) {
    // use serverConfig to customize the status dashboard output
    let config = getState().browser.serverConfig.status_dashboard;

    let devicesDevicesConf =
      config && config.devices_device_info
        ? config.devices_device_info.split(" ")
        : [];
    let devicesFilesConf =
      config && config.devices_log_files
        ? config.devices_log_files.split(" ")
        : [];
    let displayFiles =
      config && config.display_log_files != undefined
        ? config.display_log_files
        : 1;

    let deviceFileObjectsAry = [];

    return web.ListBuckets().then(res => {
      let devices = res.buckets ? res.buckets.map(bucket => bucket.name) : [];
      devices = devices.filter(e => e.match(loggerRegex));

      let devicesDevices = devicesDevicesConf.length
        ? devicesDevicesConf
        : devices;
      let devicesFiles =
        displayFiles && devicesFilesConf.length
          ? devicesFilesConf
          : displayFiles
          ? devices
          : [];

      let iDeviceFileCount = 0;

      // if no devices for files, set loaded to true
      if (devicesFiles.length == 0) {
        dispatch(loadedFiles(true));
      }

      // if no devices for config/device.json, set loaded to true
      if (devicesFiles.length == 0) {
        dispatch(loadedDevice(true));
        dispatch(loadedConfig(true));
      }

      // get device file object data
      if (!getState().dashboardStatus.loadedDevice) {
        devicesDevices.map(device => {
          web
            .getObjectStat({
              bucketName: device,
              objectName: "device.json"
            })
            .then(res => {
              iDeviceFileCount += 1;

              const deviceId = device;
              const lastModified = res.metaInfo.lastModified;

              deviceFileObjectsAry.push({ deviceId, lastModified });

              if (iDeviceFileCount == devicesDevices.length) {
                dispatch(setDeviceFileObjects(deviceFileObjectsAry));
                dispatch(fetchDeviceFileContentAll(deviceFileObjectsAry));
                dispatch(loadedDevice(true));
                dispatch(listConfigFiles(devicesDevices, devicesFiles));
              }
            })
            .catch(err => {
              iDeviceFileCount += 1;
              if (iDeviceFileCount == devicesDevices.length) {
                dispatch(setDeviceFileObjects(deviceFileObjectsAry));
                dispatch(fetchDeviceFileContentAll(deviceFileObjectsAry));
                dispatch(loadedDevice(true));
                dispatch(listConfigFiles(devicesDevices, devicesFiles));
              }
            });
        });
      }else if(!getState().dashboardStatus.loadedConfig){
        dispatch(listConfigFiles(devicesDevices, devicesFiles));
      }
    });
  };
};

export const listConfigFiles = (devicesDevices, devicesFiles) => {
  let iConfigFileCount = 0;
  let configObjectsUniqueAry = [];

  return function(dispatch, getState) {
    if (!getState().dashboardStatus.loadedConfig) {
      devicesDevices.map(device => {
        web
          .ListObjectsRecursive({
            bucketName: "Home",
            prefix: device + "/config-",
            marker: ""
          })
          .then(res => {
            iConfigFileCount += 1;

            let allObjects = [];
            res.objects.forEach(e => {
              if (e.lastModified > periodStart) {
                const name = e.name;
                const deviceId = e.name.split("/")[0];
                const lastModified = e.lastModified;
                allObjects.push({ name, deviceId, lastModified });
              }
            });

            const configObjects = allObjects.filter(obj =>
              obj.name.match(loggerConfigRegex)
            );

            let configObjectsGrouped = _.groupBy(configObjects, function(
              object
            ) {
              return object.deviceId;
            });

            let configObjectsUnique = [];

            Object.keys(configObjectsGrouped).map(function(key, index) {
              configObjectsUnique[index] =
                configObjectsGrouped[key][configObjectsGrouped[key].length - 1];
            });

            configObjectsUniqueAry = configObjectsUniqueAry.concat(
              configObjectsUnique
            );

            if (iConfigFileCount == devicesDevices.length) {
              dispatch(setConfigObjects(configObjectsUniqueAry));
              dispatch(fetchConfigFileContentAll(configObjectsUniqueAry));
              dispatch(loadedConfig(true));
              dispatch(listLogFiles(devicesFiles));
            }
          })
          .catch(err => {
            iConfigFileCount += 1;

            if (iConfigFileCount == devicesDevices.length) {
              dispatch(setConfigObjects(configObjectsUniqueAry));
              dispatch(fetchConfigFileContentAll(configObjectsUniqueAry));
              dispatch(loadedConfig(true));
              dispatch(listLogFiles(devicesFiles));
            }
          });
      });
    }else if(!getState().dashboardStatus.loadedFiles){
      dispatch(listLogFiles(devicesFiles));
    }
  };
};


export const listLogFiles = devicesFiles => {
  let iCount = 0;
  let mf4ObjectsAry = [];

  return function(dispatch, getState) {
    if (!getState().dashboardStatus.loadedFiles) {

      devicesFiles.map(device => {
        web
          .ListObjectsRecursive({
            bucketName: "Home",
            prefix: device,
            marker: ""
          })
          .then(data => {
            iCount += 1;

            let dataObjects = [];

            data.objects.forEach(e => {
              if (e.lastModified > periodStart) {
                const name =
                  e.name.substring(e.name.length - 3, e.name.length) == "mf4"
                    ? ".mf4"
                    : e.name;
                const deviceId = e.name.split("/")[0];
                const lastModified = e.lastModified;
                const size = e.size / 1000000;
                dataObjects.push({ name, deviceId, lastModified, size });
              }
            });

            
            dataObjects = dataObjects.filter(
              obj =>
                obj.name.substring(obj.name.length - 3, obj.name.length) ==
                "mf4"
            );

            mf4ObjectsAry = mf4ObjectsAry.concat(dataObjects);

            if (iCount == devicesFiles.length) {
              dispatch(setObjectsData(mf4ObjectsAry));
              dispatch(loadedFiles(true));
            }
          })
          .catch(err => {
            iCount += 1;

            if (iCount == devicesFiles.length) {
              dispatch(setObjectsData(mf4ObjectsAry));
              dispatch(loadedFiles(true));
            }
          });
      });
    }
  };
};

export const clearData = () => ({
  type: CLEAR_DATA
});

export const setObjectsData = mf4Objects => ({
  type: SET_OBJECTS_DATA,
  mf4Objects
});

export const loadedFiles = loadedFiles => ({
  type: LOADED_FILES,
  loadedFiles
});

export const loadedDevice = loadedDevice => ({
  type: LOADED_DEVICE,
  loadedDevice
});

export const loadedConfig = loadedConfig => ({
  type: LOADED_CONFIG,
  loadedConfig
});

export const setConfigObjects = configObjectsUnique => ({
  type: SET_CONFIG_OBJECTS,
  configObjectsUnique
});

export const fetchDeviceFileContentAll = deviceFileObjects => {
  const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;
  let deviceFileContents = [];

  return function(dispatch) {
    deviceFileObjects.map((deviceFileObject, i) =>
      web
        .PresignedGet({
          bucket: deviceFileObject.deviceId,
          object: "device.json",
          expiry: expiry
        })
        .then(res => {
          fetch(res.url)
            .then(r => r.json())
            .then(data => {
              deviceFileContents.push(data);
              if (deviceFileObjects.length == deviceFileContents.length) {
                dispatch(deviceFileContent(deviceFileContents));
              }
            });
        })
        .catch(e => {
          dispatch(
            alertActions.set({
              type: "danger",
              message: e.message,
              autoClear: true
            })
          );
        })
    );
  };
};

export const fetchConfigFileContentAll = configObjectsUnique => {
  const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;
  let configFileContents = [];
  let configFileCrc32 = [];

  return function(dispatch) {
    configObjectsUnique.map((configObject, i) =>
      web
        .PresignedGet({
          bucket: configObject.deviceId,
          object: configObject.name.split("/")[1],
          expiry: expiry
        })
        .then(res => {
          fetch(res.url)
            .then(r => r.json())
            .then(data => {
              configFileContents.push(data);

              crc32Val = crc32(JSON.stringify(data, null, 2))
                .toString(16)
                .toUpperCase()
                .padStart(8, "0");

              configFileCrc32.push({
                deviceId: configObject.deviceId,
                crc32: crc32Val
              });

              if (
                configObjectsUnique.length == configFileContents.length &&
                configObjectsUnique.length == configFileCrc32.length
              ) {
                dispatch(configFileContent(configFileContents));
                dispatch(setConfigFileCrc32(configFileCrc32));
              }
            });
        })
        .catch(e => {
          dispatch(
            alertActions.set({
              type: "danger",
              message: e.message,
              autoClear: true
            })
          );
        })
    );
  };
};

export const deviceFileContent = deviceFileContents => ({
  type: DEVICE_FILE_CONTENT,
  deviceFileContents
});

export const configFileContent = configFileContents => ({
  type: CONFIG_FILE_CONTENT,
  configFileContents
});

export const setConfigFileCrc32 = configFileCrc32 => ({
  type: SET_CONFIG_FILE_CRC32,
  configFileCrc32
});

export const setDeviceFileObjects = deviceFileObjects => ({
  type: SET_DEVICE_FILE_OBJECT,
  deviceFileObjects
});
