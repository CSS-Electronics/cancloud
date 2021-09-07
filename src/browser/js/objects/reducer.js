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

import * as actionsObjects from "./actions";

const removeObject = (list, objectToRemove, lookup) => {
  const idx = list.findIndex((object) => lookup(object) === objectToRemove);
  if (idx == -1) {
    return list;
  }
  return [...list.slice(0, idx), ...list.slice(idx + 1)];
};

const add = (files, action) => ({
  ...files,
  [action.slug]: {
    loaded: 0,
    size: action.size,
    name: action.name,
  },
});

const updateProgress = (files, action) => ({
  ...files,
  [action.slug]: {
    ...files[action.slug],
    loaded: action.loaded,
  },
});

const stop = (files, action) => {
  const newFiles = Object.assign({}, files);
  delete newFiles[action.slug];
  return newFiles;
};

export default (
  state = {
    list: [],
    sortBy: "",
    sortOrder: false,
    currentPrefix: "",
    marker: "",
    isTruncated: false,
    prefixWritable: false,
    shareObject: {
      show: false,
      object: "",
      url: "",
    },
    previewObject: {
      show: false,
      content: "",
    },
    files: {},
    showAbortModal: false,
    checkedList: [],
    sessionMetaList: [],
    sessionStartTimeList: [],
    sessionObjectsMetaList: [],
    objectsS3MetaStart: [],
  },
  action
) => {
  switch (action.type) {
    case actionsObjects.SET_LIST:
      return {
        ...state,
        list: action.objects,
        err: action.err,
        marker: action.marker,
        isTruncated: action.isTruncated,
      };
    case actionsObjects.RESET_LIST:
      return {
        ...state,
        list: [],
        marker: "",
        isTruncated: false,
      };
    case actionsObjects.APPEND_LIST:
      return {
        ...state,
        list: [...state.list, ...action.objects],
        marker: action.marker,
        err: action.err,
        isTruncated: action.isTruncated,
      };
    case actionsObjects.REMOVE:
      return {
        ...state,
        list: removeObject(state.list, action.object, (object) => object.name),
      };
    case actionsObjects.SET_SORT_BY:
      return {
        ...state,
        sortBy: action.sortBy,
      };
    case actionsObjects.SET_SORT_BY:
      return {
        ...state,
        sortBy: action.sortBy,
      };
    case actionsObjects.SET_SORT_ORDER:
      return {
        ...state,
        sortOrder: action.sortOrder,
      };
    case actionsObjects.SET_CURRENT_PREFIX:
      return {
        ...state,
        currentPrefix: action.prefix,
        marker: "",
        isTruncated: false,
      };
    case actionsObjects.SET_PREFIX_WRITABLE:
      return {
        ...state,
        prefixWritable: action.prefixWritable,
      };
    case actionsObjects.SET_SHARE_OBJECT:
      return {
        ...state,
        shareObject: {
          show: action.show,
          object: action.object,
          url: action.url,
        },
      };
    case actionsObjects.SET_PREVIEW_OBJECT:
      return {
        ...state,
        previewObject: {
          show: action.show,
          object: action.object,
          content: action.content,
        },
      };
    case actionsObjects.CHECKED_LIST_ADD:
      return {
        ...state,
        checkedList: [...state.checkedList, action.object],
      };
    case actionsObjects.CHECKED_LIST_REMOVE:
      return {
        ...state,
        checkedList: removeObject(state.checkedList, action.object, (object) => object),
      };
    case actionsObjects.CHECKED_LIST_RESET:
      return {
        ...state,
        checkedList: [],
      };
    case actionsObjects.ADD_SESSION_META_LIST:
      return {
        ...state,
        sessionMetaList: state.sessionMetaList.concat(action.sessionMetaList),
      };
    case actionsObjects.ADD_SESSION_START_TIME_LIST:
      return {
        ...state,
        sessionStartTimeList: state.sessionStartTimeList.concat(action.sessionStartTimeList),
      };
    case actionsObjects.RESET_SESSION_META_LIST:
      return {
        ...state,
        sessionMetaList: [],
      };
    case actionsObjects.RESET_SESSION_START_TIME_LIST:
      return {
        ...state,
        sessionStartTimeList: [],
      };
    case actionsObjects.ADD_SESSION_OBJECTS_META_LIST:
      return {
        ...state,
        sessionObjectsMetaList: state.sessionObjectsMetaList.concat(action.sessionObjectsMetaList),
      };
    case actionsObjects.ADD_OBJECTS_S3_META_START:
      return {
        ...state,
        objectsS3MetaStart: state.objectsS3MetaStart.concat(action.objectsS3MetaStart),
      };
    case actionsObjects.RESET_SESSION_OBJECTS_META_LIST:
      return {
        ...state,
        sessionObjectsMetaList: [],
      };
    case actionsObjects.RESET_OBJECTS_S3_META_START:
      return {
        ...state,
        objectsS3MetaStart: [],
      };
    case actionsObjects.SHOW_MANAGE_DEVICE_EDITOR:
      return {
        ...state,
        loadManageDeviceEditor: action.show,
      };
    case actionsObjects.HIDE_MANAGE_DEVICE_EDITOR:
      return {
        ...state,
        loadManageDeviceEditor: action.show,
      };
    case actionsObjects.OBJECT_META_INFO:
      return {
        ...state,
        info: action.info,
      };
    case actionsObjects.RESET_OBJECT_META_INFO:
      return {
        ...state,
        info: action.info,
      };
    case actionsObjects.ADD:
      return {
        ...state,
        files: add(state.files, action),
      };
    case actionsObjects.UPDATE_PROGRESS:
      return {
        ...state,
        files: updateProgress(state.files, action),
      };
    case actionsObjects.STOP:
      return {
        ...state,
        files: stop(state.files, action),
      };
    case actionsObjects.SHOW_ABORT_MODAL:
      return {
        ...state,
        showAbortModal: action.show,
      };
    default:
      return state;
  }
};
