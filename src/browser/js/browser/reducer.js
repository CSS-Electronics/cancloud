/*
 * MinIO Cloud Storage (C) 2016, 2018 MinIO, Inc.
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

import * as actionsCommon from "./actions";

export default (
  state = {
    sidebarOpen: false,
    objectName: "",
    deviceImage: undefined,
    prevDeviceFileDevice: "",
    deviceFileContent: {},
    deviceFileLastModified: "",
    deviceFileTableOpen: false,
  },
  action
) => {
  switch (action.type) {
    case actionsCommon.TOGGLE_SIDEBAR:
      return Object.assign({}, state, {
        sidebarOpen: !state.sidebarOpen
      });
    case actionsCommon.CLOSE_SIDEBAR:
    /*  return Object.assign({}, state, {
        sidebarOpen: !state.sidebarOpen
      }) */
    default:
      return state;
    case actionsCommon.SET_DEVICE_IMAGE:
      return {
        ...state,
        deviceImage: action.deviceImage
      };
    case actionsCommon.SET_PREV_DEVICE_FILE_DEVICE:
      return {
        ...state,
        prevDeviceFileDevice: action.prevDeviceFileDevice
      };
    case actionsCommon.SET_DEVICE_FILE_DATA:
      return {
        ...state,
        deviceFileContent: action.deviceFileContent
      };
    case actionsCommon.SET_DEVICE_FILE_LAST_MODIFIED:
      return {
        ...state,
        deviceFileLastModified: action.deviceFileLastModified
      };
    case actionsCommon.OPEN_DEVICE_FILE_TABLE:
      return Object.assign({}, state, {
        deviceFileTableOpen: true
      });
    case actionsCommon.TOGGLE_DEVICE_FILE_TABLE:
      return Object.assign({}, state, {
        deviceFileTableOpen: !state.deviceFileTableOpen
      });
  }
};
