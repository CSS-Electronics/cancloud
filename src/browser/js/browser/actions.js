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
export const SET_DEVICE_IMAGE = "common/SET_DEVICE_IMAGE";
import _ from "lodash";
import fetch from "isomorphic-unfetch";
import history from "../history";
import * as alertActions from "../alert/actions";
import { pathSlice } from "../utils";

export const toggleSidebar = () => ({
  type: TOGGLE_SIDEBAR
});

export const closeSidebar = () => ({
  type: CLOSE_SIDEBAR
});

// use existing listObjects for device view to extract the name of the image, then parse below (and run if an image is there)
export const fetchDeviceImage = fileName => {
  return function(dispatch, getState) {
    const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;
    const { bucket, prefix } = pathSlice(history.location.pathname);

    return web
      .PresignedGet({
        bucket: bucket,
        object: fileName,
        expiry: expiry
      })
      .then(res => {
        fetch(res.url)
          .then(data => {
            dispatch(setDeviceImage(res.url));
          })
          .catch(e => {});
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
  };
};

export const setDeviceImage = deviceImage => ({
  type: SET_DEVICE_IMAGE,
  deviceImage
});
