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
import history from "../history";
import * as alertActions from "../alert/actions";
import * as objectsActions from "../objects/actions";
import * as browserActions from "../browser/actions";
import * as dashboardStatusActions from "../dashboardStatus/actions";
import { pathSlice, isValidDevice } from "../utils";

export const SET_LIST = "buckets/SET_LIST";
export const ADD = "buckets/ADD";
export const REMOVE = "buckets/REMOVE";
export const SET_FILTER = "buckets/SET_FILTER";
export const SET_CURRENT_BUCKET = "buckets/SET_CURRENT_BUCKET";
export const SHOW_MAKE_BUCKET_MODAL = "buckets/SHOW_MAKE_BUCKET_MODAL";
export const SHOW_BUCKET_POLICY = "buckets/SHOW_BUCKET_POLICY";
export const SET_POLICIES = "buckets/SET_POLICIES";
export const SHOW_MANAGE_DEVICE_EDITOR = "bucket/SHOW_MANAGE_DEVICE_EDITOR";
export const SET_LOGOUT = "common/SET_LOGOUT";
export const SET_LIST_META = "buckets/SET_LIST_META";
export const SET_ENDPOINT_BUCKET_NAME = "buckets/SET_ENDPOINT_BUCKET_NAME";

export const fetchBuckets = () => {
  return function(dispatch) {
    return web.ListBuckets().then(res => {
      const buckets = res.buckets ? res.buckets.map(bucket => bucket.name) : [];
      const { bucket, prefix } = pathSlice(history.location.pathname);

      let devices = buckets
        .filter(bucket => isValidDevice(bucket))
        .map(bucket => {
          const deviceId = bucket;
          return { deviceId };
        });

      dispatch(getEndpointAndBucket());
      dispatch(setList(buckets));

      // load all device.json files & dispatch meta data
      dispatch(dashboardStatusActions.fetchDeviceFileContentAll(devices));

      if (bucket == "status-dashboard") {
        dispatch(dashboardStatusActions.listAllObjects());
      }

      if (buckets.length > 0) {
        if (
          bucket == "configuration" &&
          prefix &&
          buckets.indexOf(prefix) > -1
        ) {
          // Device editor mode
          dispatch(selectBucket(prefix));
        } else if (bucket && buckets.indexOf(bucket) > -1) {
          // Device browser mode
          dispatch(selectBucket(bucket, prefix));
        } else if (bucket == "configuration" && prefix == "") {
          // Simple editor mode
        } else {
          dispatch(selectBucket("Home"));
        }
      } else if (bucket != "configuration") {
        dispatch(selectBucket("Home"));
        history.replace("/");
      } else {
        return;
      }
    });
  };
};

export const addBucketMetaData = () => {
  return function(dispatch, getState) {
    let devices = getState().buckets.list.filter(bucket =>
      isValidDevice(bucket)
    );

    if (devices.length > 0) {
      let bucketsMeta = [];
      let deviceName = "";

      // extract meta name from Device Files of each bucket
      const deviceFilesContents = getState().dashboardStatus.deviceFileContents;

      for (let i = 0; i < devices.length; i++) {
        deviceName = "";

        if (deviceFilesContents.length > 0) {
          let deviceFilesContentsFiltered = deviceFilesContents.filter(
            p => p && p.id == devices[i]
          )[0];

          deviceName =
            deviceFilesContentsFiltered && deviceFilesContentsFiltered.log_meta
              ? deviceFilesContentsFiltered.log_meta
              : "";
        }

        bucketsMeta[i] =
          devices[i] + (deviceName.length ? " " : "") + deviceName;
      }

      dispatch(setListMeta(bucketsMeta));
    }
  };
};

export const fetchBucketsPostUpload = createdBucket => {
  return function(dispatch) {
    return web.ListBuckets().then(res => {
      const buckets = res.buckets ? res.buckets.map(bucket => bucket.name) : [];
      dispatch(setList(buckets));
      dispatch(addBucketMetaData());
      if (buckets.length > 0) {
        const createdBucketArray = createdBucket.split("/").slice(0, -1);
        if (createdBucket && createdBucketArray.length) {
          // && buckets.indexOf(createdBucket) > -1
          dispatch(selectBucket(createdBucketArray.join("/")));
        } else {
          dispatch(selectBucket("Home"));
        }
      } else {
        dispatch(selectBucket(""));
        history.replace("/");
      }
    });
  };
};

export const setList = buckets => {
  return {
    type: SET_LIST,
    buckets
  };
};

export const setListMeta = bucketsMeta => {
  return {
    type: SET_LIST_META,
    bucketsMeta
  };
};

export const setFilter = filter => {
  return {
    type: SET_FILTER,
    filter
  };
};

export const selectBucket = (bucket, prefix) => {
  return function(dispatch) {
    dispatch(alertActions.clear());
    dispatch(setCurrentBucket(bucket));
    dispatch(objectsActions.selectPrefix(prefix || ""));
    // fetch the device file for the selected bucket for use in meta data
    if(bucket != "Home"){
    dispatch(browserActions.fetchDeviceFile(bucket))
    }
  };
};

export const setCurrentBucket = bucket => {
  return {
    type: SET_CURRENT_BUCKET,
    bucket: bucket
  };
};

export const makeBucket = bucket => {
  return function(dispatch) {
    return web
      .MakeBucket({
        bucketName: bucket
      })
      .then(() => {
        dispatch(addBucket(bucket));
        dispatch(selectBucket(bucket));
      })
      .catch(err =>
        dispatch(
          alertActions.set({
            type: "danger",
            message:
              err.message == "Failed to fetch"
                ? "Bucket creation is only possible in this tool for servers running on Minio - for e.g. AWS, please manually create a bucket via the console"
                : err.message
          })
        )
      );
  };
};

export const deleteBucket = bucket => {
  return function(dispatch) {
    return web
      .DeleteBucket({
        bucketName: bucket
      })
      .then(() => {
        dispatch(
          alertActions.set({
            type: "info",
            message: "Bucket '" + bucket + "' has been deleted."
          })
        );
        dispatch(removeBucket(bucket));
        dispatch(fetchBuckets());
      })
      .catch(err => {
        dispatch(
          alertActions.set({
            type: "danger",
            message: err.message
          })
        );
      });
  };
};

export const addBucket = bucket => ({
  type: ADD,
  bucket
});

export const removeBucket = bucket => ({
  type: REMOVE,
  bucket
});

export const showMakeBucketModal = () => ({
  type: SHOW_MAKE_BUCKET_MODAL,
  show: true
});

export const hideMakeBucketModal = () => ({
  type: SHOW_MAKE_BUCKET_MODAL,
  show: false
});

export const fetchPolicies = bucket => {
  return function(dispatch) {
    return web
      .ListAllBucketPolicies({
        bucketName: bucket
      })
      .then(res => {
        let policies = res.policies;
        if (policies) dispatch(setPolicies(policies));
        else dispatch(setPolicies([]));
      })
      .catch(err => {
        dispatch(
          alertActions.set({
            type: "danger",
            message: err.message
          })
        );
      });
  };
};

export const setPolicies = policies => ({
  type: SET_POLICIES,
  policies
});

export const showBucketPolicy = () => ({
  type: SHOW_BUCKET_POLICY,
  show: true
});

export const hideBucketPolicy = () => ({
  type: SHOW_BUCKET_POLICY,
  show: false
});

export const userLogout = () => ({
  type: SET_LOGOUT
});

export const getEndpointAndBucket = () => {
  return function(dispatch) {
    return web
      .getEndpointAndBucketName()
      .then(res => {
        const {
          savedEndpoint: { bucketName, endPoint }
        } = res;
        dispatch(setEndpointAndBucket(bucketName, endPoint));
      })
      .catch(err => {
        console.log("Error to fetch saved bucket details", err.message);
      });
  };
};

export const setEndpointAndBucket = (bucketName, endPoint) => {
  return {
    type: SET_ENDPOINT_BUCKET_NAME,
    endPoint,
    bucketName
  };
};
