import web from "../web";
import * as alertActions from "../alert/actions";
import _ from "lodash";
export const SET_OBJECTS_DATA = "dashboardStatus/OBJECTS_RESULT";
export const DEVICE_FILE_CONTENT = "dashboardStatus/DEVICE_FILE_CONTENT";
export const SET_DEVICE_FILE_OBJECT = "dashboardStatus/SET_DEVICE_FILE_OBJECT";
export const SET_CONFIG_OBJECTS = "dashboardStatus/SET_CONFIG_OBJECTS";
export const CONFIG_FILE_CONTENT = "dashboardStatus/CONFIG_FILE_CONTENT";
export const SET_CONFIG_FILE_CRC32 = "dashboardStatus/SET_CONFIG_FILE_CRC32";
export const SET_UPLOADED_SIZE_TOTAL =
  "dashboardStatus/SET_UPLOADED_SIZE_TOTAL";
export const LOADED_ALL = "dashboardStatus/LOADED_ALL";

const { crc32 } = require("crc");

let crc32Val = "";
const loggerConfigRegex = new RegExp(
  /^([0-9A-Fa-f]){8}\/config-[0-9]{2}.[0-9]{2}.json/,
  "g"
);

export const listAllObjects = () => {
  return function(dispatch) {
    let dataAll = [];
    let periodStart = new Date(); // get current date & time
    let periodDaysMax = 30; // all objects before this period are excluded
    periodStart.setDate(periodStart.getDate() - periodDaysMax);

    return web.ListBuckets().then(res => {
      const devices = res.buckets ? res.buckets.map(bucket => bucket.name) : [];
      let iCount = 0;

      devices.map(device => {
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

            dataAll = dataAll.concat(dataObjects);
            if (iCount == devices.length) {
              dispatch(prepareListedData(dataAll));
            }
          });
      });
    });
  };
};

export const prepareListedData = allObjects => {
  return function(dispatch) {

    const deviceFileObjects = allObjects.filter(
      obj =>
        obj.name.substring(obj.name.length - 11, obj.name.length) ==
        "device.json"
    );

    const configObjects = allObjects.filter(obj =>
      obj.name.match(loggerConfigRegex)
    );

    let configObjectsGrouped = _.groupBy(configObjects, function(object) {
      return object.deviceId;
    });

    let configObjectsUnique = [];

    Object.keys(configObjectsGrouped).map(function(key, index) {
      configObjectsUnique[index] =
        configObjectsGrouped[key][configObjectsGrouped[key].length - 1];
    });

    const mf4Objects = allObjects.filter(
      obj => obj.name.substring(obj.name.length - 3, obj.name.length) == "mf4"
    );

    dispatch(setObjectsData(mf4Objects));
    dispatch(setConfigObjects(configObjectsUnique));
    dispatch(setDeviceFileObject(deviceFileObjects));
    dispatch(fetchDeviceFileContentAll(deviceFileObjects));
    dispatch(fetchConfigFileContentAll(configObjectsUnique));
    dispatch(loadedAll(true));
  };
};

export const setObjectsData = objectsData => ({
  type: SET_OBJECTS_DATA,
  objectsData
});

export const loadedAll = loaded => ({
  type: LOADED_ALL,
  loaded
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

export const setDeviceFileObject = deviceFileObjects => ({
  type: SET_DEVICE_FILE_OBJECT,
  deviceFileObjects
});
