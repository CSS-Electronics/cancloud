import web from "../web";
import * as alertActions from "../alert/actions";
import * as bucketActions from "../buckets/actions";
import _ from "lodash";
import { demoMode } from "../utils";
import load from "jszip/lib/load";

export const SET_PERIODSTART_BACK = "dashboardStatus/SET_PERIODSTART_BACK";
export const SET_OBJECTS_DATA = "dashboardStatus/SET_OBJECTS_DATA";
export const ADD_DEVICE_MARKER = "dashboardStatus/ADD_DEVICE_MARKER";
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
                dispatch(listConfigFiles(deviceFileObjectsAry, devicesDevicesInput));
              }
            })
            .catch(err => {
              dispatch(
                alertActions.set({
                  type: "danger",
                  message: "Failed to fetch information for some devices - try refreshing",
                  autoClear: true
                })
              );
              iDeviceFileCount += 1;
              if (iDeviceFileCount == devicesDevices.length) {
                dispatch(setDeviceFileObjects(deviceFileObjectsAry));
                dispatch(fetchDeviceFileContentAll(deviceFileObjectsAry));
                dispatch(loadedDevice(true));
                dispatch(listConfigFiles(deviceFileObjectsAry, devicesDevicesInput));
              }
            });
        });
      } else if (
        !getState().dashboardStatus.loadedConfig ||
        !getState().dashboardStatus.loadedFiles
      ) {
        dispatch(listConfigFiles(deviceFileObjectsAry, devicesDevicesInput));
      }
    });
  };
};

export const listConfigFiles = (deviceFileObjectsAry, devicesDevicesInput) => {

  return function(dispatch, getState) {
    let configObjectsUnique = []
    
    deviceFileObjectsAry.map((device,index) => {
      let deviceFileCfgName = getState().dashboardStatus.deviceFileContents.filter(e => e.id == device.deviceId)[0].cfg_name
      configObjectsUnique[index] = {deviceId: device.deviceId, name: device.deviceId+"/"+deviceFileCfgName}
    })

    dispatch(setConfigObjects(configObjectsUnique));
    dispatch(fetchConfigFileContentAll(configObjectsUnique));
    dispatch(loadedConfig(true));

    // note: Once the device specific info is loaded, initiate the load of the log file specific data
    // this is done as a default operation only for the case where no devicesDevicesInput is parsed
    // i.e. when the user opens the status dashboard from the menu or clicking "update" with no selection
    if (devicesDevicesInput == undefined) {
      dispatch(listLogFiles());
    }
  }
};

// list objects for log files for use in status dashboard

export const listLogFiles = devicesFilesInput => {
  return function(dispatch, getState) {
    let devices = getState().buckets.list ? getState().buckets.list : [];
    devices = devices.filter(e => e.match(loggerRegex));
    const devicesFilesDefaultMax = demoMode ? 15 : 10;

    // if the user selects specific devices (devicesFilesInput) show these. If no selection, show up to X devices by default
    let devicesFiles =
      devicesFilesInput != undefined && devicesFilesInput.length != 0
        ? devicesFilesInput
        : devices.length <= devicesFilesDefaultMax
        ? devices
        : [];

    // if no devices for files, set loaded to true
    if (devicesFiles.length == 0) {
      dispatch(loadedFiles(true));
    }

    // identify log file markers (for speed optimization) and then load log file meta data
    dispatch(identifyLogFileMarkers(devicesFiles));
  };
};

export const identifyLogFileMarkers = devicesFiles => {
  return function(dispatch, getState) {
    let logFileMarkers = [];
    devicesFiles.map(device => {
      web
        .ListObjects({
          bucketName: "Home",
          prefix: device + "/"
        })
        .then(data => {
          // implement basic binary search:
          let binL = 0;
          let binA = data.objects;
          let binR = binA.length - 1;
          let binM = Math.floor((binL + binR) / 2);

          let iCount = 0;
          let iCountMax = 2;
          let objLastPrevious = "";

          // initiate binary search by checking the edge cases (all data is before periodStart or after periodStart)
          dispatch(
            binarySearchEdges(
              binA,
              binM,
              binL,
              binR,
              iCount,
              iCountMax,
              objLastPrevious,
              logFileMarkers,
              device,
              devicesFiles
            )
          );
        });
    });
  };
};

export const binarySearchEdges = (
  binA,
  binM,
  binL,
  binR,
  iCount,
  iCountMax,
  objLastPrevious,
  logFileMarkers,
  device,
  devicesFiles
) => {
  return function(dispatch, getState) {
    let binPeriodStart = getState().dashboardStatus.periodStart;

    // if the device has no data, SKIP:
    if (binA.length == 0) {
      dispatch(
        addDeviceMarker({
          deviceId: device,
          marker: "SKIP"
        })
      );
      let logFileMarkersState = getState().dashboardStatus.logFileMarkers;
      if (devicesFiles.length == logFileMarkersState.length) {
        dispatch(processLogFiles(devicesFiles, logFileMarkersState));
      }
    } else {
      // else, if the device has data, load all objects from last session
      web
        .ListObjects({
          bucketName: "Home",
          prefix: binA[binA.length - 1].name
        })
        .then(data => {
          let lastObjectLastModified =
            data.objects[data.objects.length - 1].lastModified;

          // if all these objects are before periodStart, don't load anything
          if (lastObjectLastModified < binPeriodStart) {
            dispatch(
              addDeviceMarker({
                deviceId: device,
                marker: "SKIP"
              })
            );
            let logFileMarkersState = getState().dashboardStatus.logFileMarkers;
            if (devicesFiles.length == logFileMarkersState.length) {
              dispatch(processLogFiles(devicesFiles, logFileMarkersState));
            }
          } else {
            // else, proceed to load objects from the first session of the device
            web
              .ListObjects({
                bucketName: "Home",
                prefix: binA[0].name
              })
              .then(data => {
                let firstObjectLastModified = data.objects[0].lastModified;

                // if all these objects are after the periodStart, load everything
                if (firstObjectLastModified > binPeriodStart) {
                  dispatch(
                    addDeviceMarker({
                      deviceId: device,
                      marker: ""
                    })
                  );

                  let logFileMarkersState = getState().dashboardStatus
                    .logFileMarkers;
                  if (devicesFiles.length == logFileMarkersState.length) {
                    dispatch(
                      processLogFiles(devicesFiles, logFileMarkersState)
                    );
                  }
                } else {
                  // if objects are inside the period, run a binary search for a "marker" to optimize starting point
                  dispatch(
                    binarySearch(
                      binA,
                      binM,
                      binL,
                      binR,
                      iCount,
                      iCountMax,
                      objLastPrevious,
                      logFileMarkers,
                      device,
                      devicesFiles
                    )
                  );
                }
              });
          }
        });
    }
  };
};

export const binarySearch = (
  binA,
  binM,
  binL,
  binR,
  iCount,
  iCountMax,
  objLastPrevious,
  logFileMarkers,
  device,
  devicesFiles
) => {
  return function(dispatch, getState) {
    let binPeriodStart = getState().dashboardStatus.periodStart;
    web
      .ListObjects({
        bucketName: "Home",
        prefix: binA[binM].name
      })
      .then(data => {
        let objFirst = data.objects[0];
        let objLast = data.objects[data.objects.length - 1];

        let firstBeforeT = objFirst.lastModified < binPeriodStart;
        let lastBeforeT = objLast.lastModified < binPeriodStart;
        if (firstBeforeT && !lastBeforeT) {
          dispatch(
            addDeviceMarker({
              deviceId: device,
              marker: objFirst.name
            })
          );
        } else if (firstBeforeT && lastBeforeT) {
          // all session objects are before periodStart --> jump forwards
          binL = binM + 1;
          binM = Math.floor((binL + binR) / 2);

          if (iCount == iCountMax) {
            // if final count is reached, take the last marker in session
            dispatch(
              addDeviceMarker({
                deviceId: device,
                marker: objFirst.name
              })
            );
          } else {
            iCount += 1;
            objLastPrevious = objLast;
            dispatch(
              binarySearch(
                binA,
                binM,
                binL,
                binR,
                iCount,
                iCountMax,
                objLastPrevious,
                logFileMarkers,
                device,
                devicesFiles
              )
            );
          }
        } else {
          // all session objects are after periodStart --> jump backwards
          binR = binM - 1;
          binM = Math.floor((binL + binR) / 2);

          if (iCount == iCountMax) {
            // if final count is reached while we're "too far", we use the previous marker as fallback
            dispatch(
              addDeviceMarker({
                deviceId: device,
                marker: objFirst.name
              })
            );
          } else {
            iCount += 1;
            dispatch(
              binarySearch(
                binA,
                binM,
                binL,
                binR,
                iCount,
                iCountMax,
                objLastPrevious,
                logFileMarkers,
                device,
                devicesFiles
              )
            );
          }
        }

        // when all markers are found, list and process log files with the markers
        let logFileMarkersState = getState().dashboardStatus.logFileMarkers;
        if (
          devicesFiles.length == logFileMarkersState.length &&
          devicesFiles.length != 0
        ) {
          dispatch(processLogFiles(devicesFiles, logFileMarkersState));
        }
      });
  };
};

export const processLogFiles = (devicesFiles, logFileMarkers) => {
  let iCount = 0;

  let mf4ObjectsHourAry = [];
  let mf4ObjectsMinAry = [];
  let lastFileAry = [];
  let dateFormats = ["YYYY-MM-DD HH", "YYYY-MM-DD HH:mm"];

  return function(dispatch, getState) {
    let binPeriodStart = getState().dashboardStatus.periodStart;

    // start by initializing the device processed counter
    dispatch(setDevicesFilesCount(iCount));

    // load all log files recursively for each device in devicesFiles
    if (!getState().dashboardStatus.loadedFiles) {
      devicesFiles.map(device => {
        let marker = logFileMarkers.filter(e => e.deviceId == device)[0]
          ? logFileMarkers.filter(e => e.deviceId == device)[0].marker
          : "";
        if (marker == "SKIP") {
          iCount += 1;
          dispatch(setDevicesFilesCount(iCount));
          if (
            getState().dashboardStatus.devicesFilesCount == devicesFiles.length
          ) {
            dispatch(setDeviceLastMf4MetaData(lastFileAry));
            dispatch(setObjectsData(mf4ObjectsHourAry));
            dispatch(setObjectsDataMin(mf4ObjectsMinAry));
            dispatch(loadedFiles(true));
          }
        } else {
          web
            .ListObjectsRecursive({
              bucketName: "Home",
              prefix: device + "/",
              marker: marker
            })
            .then(data => {
              iCount += 1;
              dispatch(setDevicesFilesCount(iCount));

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
                let periodStartVar = index == 0 ? binPeriodStart : lastHour;
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
                        Math.round(parseFloat(acc[lastModH] + size) * 100) /
                        100;
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
                  const periodStartVarFormat = speedDate(
                    format,
                    periodStartVar
                  );

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

              // when all devices are processed, dispatch the full data and set loadedFiles to true to display the data
              if (
                getState().dashboardStatus.devicesFilesCount ==
                devicesFiles.length
              ) {
                dispatch(setDeviceLastMf4MetaData(lastFileAry));
                dispatch(setObjectsData(mf4ObjectsHourAry));
                dispatch(setObjectsDataMin(mf4ObjectsMinAry));
                dispatch(loadedFiles(true));
              }
            });
        }
      });
    }
  };
};

export const fetchDeviceFileContentAll = deviceFileObjects => {
  const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;
  let deviceFileContents = [];


  return function(dispatch, getState) {
    let iDeviceFileCount = 0;
    deviceFileObjects.map((deviceFileObject, i) =>
      web
        .PresignedGet({
          bucket: deviceFileObject.deviceId,
          object: "device.json",
          expiry: expiry
        })
        .then(res => {
          fetch(res.url)
            .then(r => r.json().catch(e => {}))
            .then(data => {
              iDeviceFileCount += 1;
              deviceFileContents.push(data);

              if (deviceFileObjects.length == iDeviceFileCount) {
                dispatch(
                  deviceFileContent(
                    deviceFileContents.filter(obj => obj != undefined)
                  )
                );

                // add meta names to sidebar devices, but only during the initial page load
                let devices = getState().buckets.list.filter(e => e.match(loggerRegex))
                let loadAll = devices.length == deviceFileObjects.length
                if(loadAll){
                  dispatch(bucketActions.addBucketMetaData());
                }
              }
            }).catch(e => {
              dispatch(
                alertActions.set({
                  type: "danger",
                  message: e.message,
                  autoClear: true
                })
              );
            })
        })
        .catch(e => {
          dispatch(
            alertActions.set({
              type: "danger",
              message: e.message,
              autoClear: true
            })
          );
          iDeviceFileCount += 1;

          if (deviceFileObjects.length == iDeviceFileCount) {
            dispatch(
              deviceFileContent(
                deviceFileContents.filter(obj => obj != undefined)
              )
            );
          }
        })
    );
  };
};

export const fetchConfigFileContentAll = configObjectsUnique => {
  const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;
  let configFileContents = [];
  let configFileCrc32 = [];
  
  return function(dispatch) {
    
    // clear configFileCrc32
    dispatch(setConfigFileCrc32([]));

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
            })
            .catch(e => {

              configFileContents.push({});
              configFileCrc32.push({
                deviceId: configObject.deviceId,
                crc32: "NA"
              });
              console.log("No valid config found");
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

export const addDeviceMarker = logFileMarker => ({
  type: ADD_DEVICE_MARKER,
  logFileMarker
});

export const setPeriodStartBack = periodDelta => ({
  type: SET_PERIODSTART_BACK,
  periodDelta
});
