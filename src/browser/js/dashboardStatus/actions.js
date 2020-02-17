import web from "../web";

import * as alertActions from "../alert/actions";
import * as commonActions from "../browser/actions";
import _ from "lodash";
export const SET_OBJECTS_DATA = "dashboardStatus/SET_OBJECTS_DATA";
export const SET_LAST_OBJECT_DATA = "dashboardStatus/SET_LAST_OBJECT_DATA";
export const SET_OBJECTS_DATA_MIN = "dashboardStatus/SET_OBJECTS_DATA_MIN";
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
export const CLEAR_DATA_DEVICES = "dashboardStatus/CLEAR_DATA_DEVICES";
export const CLEAR_DATA_FILES = "dashboardStatus/CLEAR_DATA_FILES";
export const SET_DEVICES_FILES_COUNT =
  "dashboardStatus/SET_DEVICES_FILES_COUNT";

var speedDate = require("speed-date");
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

let lastHour = new Date();
lastHour.setTime(lastHour.getTime() - 1 * 60 * 60 * 1000);

// list objects for devices (device.json and config-XX.YY.json)
export const listAllObjects = devicesDevicesInput => {
  return function(dispatch, getState) {
    let deviceFileObjectsAry = [];

    return web.ListBuckets().then(res => {
      let devices = res.buckets ? res.buckets.map(bucket => bucket.name) : [];
      devices = devices.filter(e => e.match(loggerRegex));

      // list devices selected in the status dashboard dropdown - or list all devices as default
      let devicesDevices = devicesDevicesInput
        ? devicesDevicesInput.length
          ? devicesDevicesInput
          : []
        : devices;

      let iDeviceFileCount = 0;

      // if no devices are found, set loaded to true for Device File and Configuration File
      if (devicesDevices.length == 0) {
        dispatch(loadedDevice(true));
        dispatch(loadedConfig(true));
      }

      // else, get relevant Device File object meta data for each device (for Heartbeat info)
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

              deviceFileObjectsAry.push({
                deviceId,
                lastModified
              });

              // when all devices are processed, update state and fetch the Device File contents and list Configuration Files
              if (iDeviceFileCount == devicesDevices.length) {
                dispatch(setDeviceFileObjects(deviceFileObjectsAry));
                dispatch(fetchDeviceFileContentAll(deviceFileObjectsAry));
                dispatch(loadedDevice(true));
                dispatch(listConfigFiles(devicesDevices, devicesDevicesInput));
              }
            })
            .catch(err => {
              iDeviceFileCount += 1;
              if (iDeviceFileCount == devicesDevices.length) {
                dispatch(setDeviceFileObjects(deviceFileObjectsAry));
                dispatch(fetchDeviceFileContentAll(deviceFileObjectsAry));
                dispatch(loadedDevice(true));
                dispatch(listConfigFiles(devicesDevices, devicesDevicesInput));
              }
            });
        });
      } else if (
        !getState().dashboardStatus.loadedConfig ||
        !getState().dashboardStatus.loadedFiles
      ) {
        dispatch(listConfigFiles(devicesDevices, devicesDevicesInput));
      }
    });
  };
};

export const listConfigFiles = (devicesDevices, devicesDevicesInput) => {
  let iConfigFileCount = 0;
  let configObjectsUniqueAry = [];

  // if the configs are not yet loaded, load one for each device
  return function(dispatch, getState) {
    if (!getState().dashboardStatus.loadedConfig) {
      devicesDevices.map(device => {
        web
          .ListObjects({
            bucketName: device,
            prefix: "config-",
            marker: ""
          })
          .then(res => {
            iConfigFileCount += 1;
            let allObjects = [];

            // allocate the configs to an array of objects (note: Each device may have multiple configs)
            res.objects.forEach(e => {
              const deviceId = device;
              const name = device + "/config-" + e.name;
              const lastModified = e.lastModified;
              allObjects.push({
                name,
                deviceId,
                lastModified
              });
            });

            // ensure that configs match the regex
            const configObjects = allObjects.filter(obj =>
              obj.name.match(loggerConfigRegex)
            );

            // group the configs by device ID
            let configObjectsGrouped = _.groupBy(configObjects, function(
              object
            ) {
              return object.deviceId;
            });

            let configObjectsUnique = [];

            // create a list of unique configs per device, taking the last (latest) config
            Object.keys(configObjectsGrouped).map(function(key, index) {
              configObjectsUnique[index] =
                configObjectsGrouped[key][configObjectsGrouped[key].length - 1];
            });

            // for each device, add the resulting data to an array
            configObjectsUniqueAry = configObjectsUniqueAry.concat(
              configObjectsUnique
            );

            // once each device is processed, update state and fetch the config contents
            if (iConfigFileCount == devicesDevices.length) {
              dispatch(setConfigObjects(configObjectsUniqueAry));
              dispatch(fetchConfigFileContentAll(configObjectsUniqueAry));
              dispatch(loadedConfig(true));

              // note: Once the device specific info is loaded, initiate the load of the log file specific data
              // this is done as a default operation only for the case where no devicesDevicesInput is parsed
              // i.e. when the user opens the status dashboard from the menu or clicking "update" with no selection
              if (devicesDevicesInput == undefined) {
                dispatch(listLogFiles());
              }
            }
          })
          .catch(err => {
            iConfigFileCount += 1;

            if (iConfigFileCount == devicesDevices.length) {
              dispatch(setConfigObjects(configObjectsUniqueAry));
              dispatch(fetchConfigFileContentAll(configObjectsUniqueAry));
              dispatch(loadedConfig(true));
              if (devicesDevicesInput == undefined) {
                dispatch(listLogFiles());
              }
            }
          });
      });
    } else if (!getState().dashboardStatus.loadedFiles) {
      if (devicesDevicesInput == undefined) {
        dispatch(listLogFiles());
      }
    }
  };
};

// list objects for log files for use in status dashboard

export const listLogFiles = devicesFilesInput => {

  return function(dispatch, getState) {
    let devices = getState().buckets.list ? getState().buckets.list : [];
    devices = devices.filter(e => e.match(loggerRegex));
    const devicesFilesDefaultMax = 5;

    // if the user selects specific devices (devicesFilesInput) show these. If no selection, show up to X devices by default
    let devicesFiles = devicesFilesInput
      ? devicesFilesInput
      : devices.length <= devicesFilesDefaultMax
      ? devices
      : [];

    // if no devices for files, set loaded to true
    if (devicesFiles.length == 0) {
      dispatch(loadedFiles(true));
    }

    dispatch(processLogFiles(devicesFiles,""))
  
  };
};



export const processLogFiles = (devicesFiles,marker) =>{

  let iCount = 0
  let mf4ObjectsHourAry = [];
  let mf4ObjectsMinAry = [];
  let lastFileAry = [];
  let dateFormats = ["YYYY-MM-DD HH", "YYYY-MM-DD HH:mm"];

  return function(dispatch, getState) {

    // load all log files recursively for each device in devicesFiles
    if (!getState().dashboardStatus.loadedFiles) {
      devicesFiles.map(device => {
        web
          .ListObjectsRecursive({
            bucketName: "Home",
            prefix: device + "/0",
            marker: ""
          })
          .then(data => {
            iCount += 1;

            // extract the last uploaded log file for each device
            let lastFile = data.objects[data.objects.length - 1];

            if (lastFile) {
              lastFileAry = lastFileAry.concat(
                data.objects[data.objects.length - 1]
              );
            }

            // Aggregate the loaded data information to either hourly or minute basis by mapping across dateFormats
            // First, data is aggregated to hourly basis for the full period since periodStart
            // After this, it is aggregated to minute basis for the lastHour
            dateFormats.map((format, index) => {
              let periodStartVar = index == 0 ? periodStart : lastHour;
              let sizePerTime = {};

              // aggregate log file size
              sizePerTime = data.objects.reduce(
                (acc, { lastModified, size }) => {
                  if (lastModified > periodStartVar) {
                    const lastModH = speedDate.cached(format, lastModified);

                    if (!acc) {
                      acc = {};
                    }

                    if (!acc[lastModH]) {
                      acc[lastModH] = 0;
                    }

                    acc[lastModH] =
                      Math.round(parseFloat(acc[lastModH] + size) * 100) / 100;
                    return acc;
                  }
                },
                {}
              );

              // aggregate log file count
              let countPerTime = data.objects.reduce(
                (accCnt, { lastModified }) => {
                  if (lastModified > periodStartVar) {
                    const lastModH = speedDate.cached(format, lastModified);

                    if (!accCnt) {
                      accCnt = {};
                    }

                    if (!accCnt[lastModH]) {
                      accCnt[lastModH] = 0;
                    }

                    accCnt[lastModH] = parseInt(accCnt[lastModH] + 1);
                    return accCnt;
                  }
                },
                {}
              );

              // combine device log file data into an object structure for combining with data from other devices
              let dataPerTimeAry = [];
              if (sizePerTime) {
                const periodStartVarFormat = speedDate(format, periodStartVar);

                Object.keys(sizePerTime).forEach(e => {
                  if (e > periodStartVarFormat) {
                    const deviceId = device;
                    const lastModified = e;
                    const size = sizePerTime[e] / (1024 * 1024);
                    const count = countPerTime[e];
                    dataPerTimeAry.push({
                      deviceId,
                      lastModified,
                      size,
                      count
                    });
                  }
                });
              }

              if (index == 0) {
                mf4ObjectsHourAry = mf4ObjectsHourAry.concat(dataPerTimeAry);
              } else {
                mf4ObjectsMinAry = mf4ObjectsMinAry.concat(dataPerTimeAry);
              }
            });

            dispatch(setDevicesFilesCount(iCount));

            // when all devices are processed, dispatch the full data and set loadedFiles to true to display the data
            if (iCount == devicesFiles.length) {
              dispatch(mf4MetaHeader(lastFileAry));
              dispatch(setObjectsData(mf4ObjectsHourAry));
              dispatch(setObjectsDataMin(mf4ObjectsMinAry));
              dispatch(loadedFiles(true));
            }
          });
      });
    }
  }
}



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
            .then(r => r.text())
            .then(data => {
              configFileContents.push(JSON.parse(data));

              crc32Val = crc32(data)
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

// get first part of object
export const mf4MetaHeader = mf4Objects => {
  return function(dispatch, getState) {
    let deviceLastMf4MetaData = [];
    let iCount = 0;

    mf4Objects.map(object => {
      web
        .GetPartialObject({
          bucketName: "Home",
          objectName: object.name,
          byteLength: 3000
        })
        .then(objContent => {
          iCount += 1;
          let storageTotalKb = objContent.objContent
            .split('<e name="storage total" ro="true">')
            .pop()
            .split("</e>")[0];
          let storageFreeKb = objContent.objContent
            .split('<e name="storage free" ro="true">')
            .pop()
            .split("</e>")[0];
          let storageFree =
            Math.round(
              (parseInt(storageFreeKb) / parseInt(storageTotalKb)) * 1000
            ) / 10;
          let deviceId = object.name.split("/")[0];
          let lastModified = object.lastModified;

          if (storageFree) {
            deviceLastMf4MetaData = deviceLastMf4MetaData.concat({
              deviceId: deviceId,
              lastModified: lastModified,
              storageFree: storageFree
            });
          }
          if (iCount == mf4Objects.length) {
            dispatch(setDeviceLastMf4MetaData(deviceLastMf4MetaData));
          }
        })
        .catch(err => {
          dispatch(
            alertActions.set({
              type: "danger",
              message: err.message
            })
          );
        });
    });
  };
};

export const clearDataDevices = () => ({
  type: CLEAR_DATA_DEVICES
});

export const clearDataFiles = () => ({
  type: CLEAR_DATA_FILES
});

export const setObjectsData = mf4Objects => ({
  type: SET_OBJECTS_DATA,
  mf4Objects
});

export const setDeviceLastMf4MetaData = deviceLastMf4MetaData => ({
  type: SET_LAST_OBJECT_DATA,
  deviceLastMf4MetaData
});

export const setDevicesFilesCount = devicesFilesCount => ({
  type: SET_DEVICES_FILES_COUNT,
  devicesFilesCount
});

export const setObjectsDataMin = mf4ObjectsMin => ({
  type: SET_OBJECTS_DATA_MIN,
  mf4ObjectsMin
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
