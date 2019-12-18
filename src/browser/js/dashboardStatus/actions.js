import web from "../web";
import * as alertActions from "../alert/actions";
import * as commonActions from "../browser/actions";
import _ from "lodash";
export const SET_OBJECTS_DATA = "dashboardStatus/SET_OBJECTS_DATA";
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

export const listAllObjects = devicesDevicesInput => {
  return function(dispatch, getState) {
    let deviceFileObjectsAry = [];

    return web.ListBuckets().then(res => {
      let devices = res.buckets ? res.buckets.map(bucket => bucket.name) : [];
      devices = devices.filter(e => e.match(loggerRegex));

      // by default show all devices for the device info and none for the log file info (unless fewer than 3 devices)
      let devicesDevices = devicesDevicesInput
        ? devicesDevicesInput.length
          ? devicesDevicesInput
          : []
        : devices;

      let iDeviceFileCount = 0;

      // if no devices for config/device.json, set loaded to true
      if (devicesDevices.length == 0) {
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
            res.objects.forEach(e => {
              const deviceId = device;
              const name = device + "/config-" + e.name;
              const lastModified = e.lastModified;
              allObjects.push({ name, deviceId, lastModified });
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

export const listLogFiles = devicesFilesInput => {
  let iCount = 0;
  let mf4ObjectsHourAry = [];
  let mf4ObjectsMinAry = [];
  let dateFormats = ["YYYY-MM-DD HH", "YYYY-MM-DD HH:mm"];

  return function(dispatch, getState) {
    let devices = getState().buckets.list ? getState().buckets.list : [];
    devices = devices.filter(e => e.match(loggerRegex));

    const devicesFilesDefaultMax = 3;

    // by default show all devices for the device info and none for the log file info (unless fewer than 3 devices)
    let devicesFiles = devicesFilesInput
      ? devicesFilesInput.length
        ? devicesFilesInput
        : []
      : devices.length <= devicesFilesDefaultMax
      ? devices
      : [];

    // if no devices for files, set loaded to true
    if (devicesFiles.length == 0) {
      dispatch(loadedFiles(true));
    }

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

            // aggregate data to hourly basis
            dateFormats.map((format, index) => {
              let periodStartVar = index == 0 ? periodStart : lastHour;
              let sizePerTime = {};

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

            if (iCount == devicesFiles.length) {
              dispatch(setObjectsData(mf4ObjectsHourAry));
              dispatch(setObjectsDataMin(mf4ObjectsMinAry));
              dispatch(loadedFiles(true));
            }
          });
        // .catch(err => {
        //   iCount += 1;

        //   if (iCount == devicesFiles.length) {
        //     dispatch(setObjectsData(mf4ObjectsAry));
        //     dispatch(loadedFiles(true));
        //   }
        // });
      });
    }
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
