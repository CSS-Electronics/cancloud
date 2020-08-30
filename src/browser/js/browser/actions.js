/*
 * Minio Cloud Storage (C) 2018 Minio, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import web from "../web";
import Moment from "moment";
import { getCurrentBucket } from "../buckets/selectors";
import * as dashboardStatusActions from "../dashboardStatus/actions"


export const TOGGLE_SIDEBAR = "common/TOGGLE_SIDEBAR";
export const CLOSE_SIDEBAR = "common/CLOSE_SIDEBAR";
export const SET_DEVICE_IMAGE = "common/SET_DEVICE_IMAGE";
export const TOGGLE_DEVICE_FILE_TABLE = "common/TOGGLE_DEVICE_FILE_TABLE";


export const SET_DEVICE_FILE_DATA = "common/SET_DEVICE_FILE_DATA";
export const SET_PREV_DEVICE_FILE_DEVICE = "common/SET_PREV_DEVICE_FILE_DEVICE";
export const SET_DEVICE_FILE_LAST_MODIFIED = "common/SET_DEVICE_FILE_LAST_MODIFIED";
export const OPEN_DEVICE_FILE_TABLE = "common/OPEN_DEVICE_FILE_TABLE";

export const toggleDeviceFileTable = () => ({
  type: TOGGLE_DEVICE_FILE_TABLE
});


export const setDeviceFileContent = (deviceFileContent) => ({
  type: SET_DEVICE_FILE_DATA,
  deviceFileContent,
});

export const setPrevDeviceFileDevice = (prevDeviceFileDevice) => ({
  type: SET_PREV_DEVICE_FILE_DEVICE,
  prevDeviceFileDevice,
});

export const setDeviceFileLastModified = (deviceFileLastModified) => ({
  type: SET_DEVICE_FILE_LAST_MODIFIED,
  deviceFileLastModified,
});

export const openDeviceFileTable = () => ({
  type: OPEN_DEVICE_FILE_TABLE
});

// below fetches content of device.json file
export const fetchDeviceFileContent = (fileName, device) => {
  return function (dispatch, getState) {
    if (fileName == "") {
      dispatch(setDeviceFileContent(null));
    } else {
      const { bucket, prefix } = pathSlice(history.location.pathname);
      const currentBucket = getCurrentBucket(getState());
      const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;

      if (currentBucket && fileName) {
        return web
          .PresignedGet({
            bucket: currentBucket,
            object: fileName,
            expiry: expiry,
          })
          .then((res) => {
            fetch(res.url)
              .then((r) => r.json())
              .then((data) => {
                
                dispatch(setDeviceFileContent(data));
                dispatch(setPrevDeviceFileDevice(device));

                // get the Configuration File content matching the device.json for use in crc32 comparison
                let cfg_name = data.cfg_name;
                let configObject = [
                  { deviceId: device, name: device + "/" + cfg_name },
                ];


                if (!configObject[0].name.includes("undefined")) {
                  dispatch(
                    dashboardStatusActions.fetchConfigFileContentAll(
                      configObject
                    )
                  );
                }
                
              })
              .catch((e) => {
                dispatch(setDeviceFileContent(null));
                dispatch(
                  alertActions.set({
                    type: "danger",
                    message: `Warning: The file ${fileName} is invalid and was not loaded`,
                    autoClear: true,
                  })
                );
              });
          })
          .catch((err) => {
            if (web.LoggedIn()) {
              dispatch(
                alertActions.set({
                  type: "danger",
                  message: err.message,
                  autoClear: true,
                })
              );
            } else {
              history.push("/login");
            }
          });
      } else if (prefix) {
        dispatch(setDeviceFileContent(null));
      } else {
        dispatch(setDeviceFileContent(null));
      }
    }
  };
};

export const fetchDeviceFileIfNew = (device) => {
  return function (dispatch, getState) {
    if (
      getState().buckets.currentBucket ==
        getState().editor.prevDeviceFileDevice ||
      device == "Home"
    ) {
      return;
    } else {
      dispatch(fetchDeviceFile(device));
    }
  };
};

export const fetchDeviceFile = (device) => {
  return function (dispatch) {
    dispatch(setDeviceFileContent(null));
    return web
      .ListObjects({
        bucketName: device,
        prefix: "",
        marker: "",
      })
      .then((data) => {
        const deviceFileObject = data.objects.filter(
          (p) => p.name === "device.json"
        )[0];
        const deviceFileName = deviceFileObject ? deviceFileObject.name : null;
        const deviceFileLastModified = deviceFileObject
          ? Moment(deviceFileObject.lastModified).format(
              "MMMM Do YYYY, h:mm:ss a"
            )
          : "";

        if (deviceFileObject) {
          dispatch(fetchDeviceFileContent(deviceFileName, device));
          dispatch(setDeviceFileLastModified(deviceFileLastModified));
        } else {
          // dispatch(
          //   alertActions.set({
          //     type: "info",
          //     message: `The device does not have an uploaded device.json file`,
          //     autoClear: true
          //   })
          // );
        }
      })
      .catch((err) => {
        if (web.LoggedIn()) {
          dispatch(
            alertActions.set({
              type: "danger",
              message: err.message,
              autoClear: true,
            })
          );
        } else {
          history.push("/login");
        }
      });
  };
};

import _ from "lodash";
import fetch from "isomorphic-unfetch";
import history from "../history";
import * as alertActions from "../alert/actions";
import { pathSlice } from "../utils";

export const toggleSidebar = () => ({
  type: TOGGLE_SIDEBAR,
});

export const closeSidebar = () => ({
  type: CLOSE_SIDEBAR,
});

// use existing listObjects for device view to extract the name of the image, then parse below (and run if an image is there)
export const fetchDeviceImage = (fileName) => {
  return function (dispatch, getState) {
    const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;
    const { bucket, prefix } = pathSlice(history.location.pathname);

    return web
      .PresignedGet({
        bucket: bucket,
        object: fileName,
        expiry: expiry,
      })
      .then((res) => {
        fetch(res.url)
          .then((data) => {
            dispatch(setDeviceImage(res.url));
          })
          .catch((e) => {});
      })
      .catch((err) => {
        if (web.LoggedIn()) {
          dispatch(
            alertActions.set({
              type: "danger",
              message: err.message,
              autoClear: false,
            })
          );
        } else {
          history.push("/login");
        }
      });
  };
};

export const setDeviceImage = (deviceImage) => ({
  type: SET_DEVICE_IMAGE,
  deviceImage,
});
