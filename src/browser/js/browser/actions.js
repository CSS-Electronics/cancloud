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

export const TOGGLE_SIDEBAR = "common/TOGGLE_SIDEBAR";
export const CLOSE_SIDEBAR = "common/CLOSE_SIDEBAR";
export const SET_STORAGE_INFO = "common/SET_STORAGE_INFO";
export const SET_SERVER_INFO = "common/SET_SERVER_INFO";
export const SET_SERVER_CONFIG_DATA = "common/SET_SERVER_CONFIG_DATA";
export const SET_SERVER_IMAGE = "common/SET_SERVER_IMAGE";
export const SET_SERVER_CONFIG_MOD_DATE = "common/SET_SERVER_CONFIG_MOD_DATE";
export const SET_BUCKET_ENDPOINT = "common/SET_BUCKET_ENDPOINT";
import _ from "lodash";
import fetch from "isomorphic-unfetch";
import history from "../history";
import * as alertActions from "../alert/actions";
import * as bucketActions from "../buckets/actions";
import * as dashboardStatusActions from "../dashboardStatus/actions";
import { pathSlice } from "../utils";

export const toggleSidebar = () => ({
  type: TOGGLE_SIDEBAR
});

export const closeSidebar = () => ({
  type: CLOSE_SIDEBAR
});

export const fetchStorageInfo = () => {
  return function(dispatch) {
    const storageInfo = {
      total: 0,
      used: 0
    };
    dispatch(setStorageInfo(storageInfo));
  };
};

export const setStorageInfo = storageInfo => ({
  type: SET_STORAGE_INFO,
  storageInfo
});

export const fetchServerInfo = () => {
  return function(dispatch) {
    const serverInfo = {
      version: "",
      memory: "",
      platform: "",
      runtime: "",
      info: ""
    };
    dispatch(setServerInfo(serverInfo));
  };
};

export const setServerInfo = serverInfo => ({
  type: SET_SERVER_INFO,
  serverInfo
});

const regexConfig = new RegExp(/config/, "g");

export const fetchServerObjectList = () => {
  return function(dispatch) {
    return web
      .ListObjects({
        bucketName: "server",
        prefix: "",
        marker: ""
      })
      .then(data => {
        let allObjects = [];
        allObjects = data.objects.map(object => object.name.split("/")[0]);

        let configName = allObjects
          .filter(str => str.match(regexConfig))
          .sort()
          .reverse()[0];

        let configObject = data.objects.filter(p => p.name === configName)[0];

        dispatch(fetchServerConfigContent(configObject));
      })
      .catch(err => {
        if (web.LoggedIn()) {
          dispatch(
            alertActions.set({
              type: "danger",
              message: err.message,
              autoClear: true
            })
          );
        } else {
          history.push("/login");
        }
      });
  };
};

export const setServerConfigModDate = serverConfigModDate => ({
  type: SET_SERVER_CONFIG_MOD_DATE,
  serverConfigModDate
});

export const fetchServerConfigContent = fileObject => {
  return function(dispatch, getState) {

    const { bucket, prefix } = pathSlice(history.location.pathname);

    if (fileObject === undefined) {
      // No configuration file
      dispatch(setServerConfigContent({}));

      if(bucket == "status-dashboard"){
        dispatch(dashboardStatusActions.listAllObjects())
      }
      return;
    }
    const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;

    const serverConfigModStore = getState().browser.serverConfigModDate.toString();
    const serverConfigModObject = fileObject.lastModified.toString();

    if (serverConfigModStore !== serverConfigModObject) {

      return web
        .PresignedGet({
          bucket: "server",
          object: fileObject.name,
          expiry: expiry
        })
        .then(res => {
          fetch(res.url)
            .then(r => r.json())
            .then(data => {
              dispatch(setServerConfigContent(data));
              dispatch(setServerConfigModDate(fileObject.lastModified));

              // Below ensures that the device image is loaded on the initial mount
              const testRegex = getState().buckets.currentBucket.match(loggerRegex) 

              const { bucket, prefix } = pathSlice(history.location.pathname);

              let deviceList = data.devicemeta.devices ? data.devicemeta.devices : []
              if (testRegex) {
                let imageName = deviceList.filter(
                  p => p.serialno === getState().buckets.currentBucket
                )[0];

                if (
                  imageName !== undefined &&
                  imageName.imageurl !== undefined &&
                  bucket != "configuration"
                ) {
                  dispatch(fetchServerImage(imageName.imageurl));
                }
              }

              // assign meta data to devices after the serverConfig has loaded
              dispatch(bucketActions.addBucketMetaData());

              if(bucket == "status-dashboard"){
                dispatch(dashboardStatusActions.listAllObjects())
              }
            })
            .catch(e => {
              dispatch(
                alertActions.set({
                  type: "danger",
                  message: `Warning: Server config is invalid and was not loaded`,
                  autoClear: false
                })
              );
              if(bucket == "status-dashboard"){
                dispatch(dashboardStatusActions.listAllObjects())
              }
            });
        })
        .catch(err => {
          if (web.LoggedIn()) {
            dispatch(
              alertActions.set({
                type: "danger",
                message: err.message,
                autoClear: false
              })
            );

            if(bucket == "status-dashboard"){
              dispatch(dashboardStatusActions.listAllObjects())
            }
          } else {
            history.push("/login");
          }
        });
    } else {
      if(bucket == "status-dashboard"){
        dispatch(dashboardStatusActions.listAllObjects())
      }
      // Do nothing
    }
  };
};

export const setServerConfigContent = serverConfig => ({
  type: SET_SERVER_CONFIG_DATA,
  serverConfig
});

const regexHttp = new RegExp(/^http/, "g");
const regexFileExt = new RegExp(/\b(png|PNG|jpg|JPG|jpeg|JPEG|svg|SVG)\b/, "g");
const loggerRegex = new RegExp(/([0-9A-Fa-f]){8}/);

export const fetchServerImage = fileName => {
  return function(dispatch, getState) {
    if (fileName === undefined) {
      // Meta image is blank
      return;
    }
    const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;
    let imageObject = {};

    const serverImageLoaded = getState().browser.serverImage.filter(
      p => p.name === fileName
    ).length;

    if (fileName.match(regexHttp) !== null) {
      // Meta image is an external URL
      imageObject.name = fileName;
      imageObject.url = fileName;

      dispatch(setServerImage([imageObject]));
      return;
    } else if (serverImageLoaded === 0) {
      return web
        .PresignedGet({
          bucket: "server",
          object: fileName,
          expiry: expiry
        })
        .then(res => {
          fetch(res.url)
            .then(data => {
              imageObject.name = fileName;
              imageObject.url = res.url;

              dispatch(setServerImage([imageObject]));
            })
            .catch(e => {
              dispatch(
                alertActions.set({
                  type: "danger",
                  message: `Warning: Server image ${fileName} is invalid and was not loaded`,
                  autoClear: false
                })
              );
            });
        })
        .catch(err => {
          if (web.LoggedIn()) {
            dispatch(
              alertActions.set({
                type: "danger",
                message: err.message,
                autoClear: false
              })
            );
          } else {
            history.push("/login");
          }
        });
    } else {
      // Do nothing
    }
  };
};

export const setServerImage = serverImage => ({
  type: SET_SERVER_IMAGE,
  serverImage
});
