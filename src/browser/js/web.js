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

import JSONrpc from "./jsonrpc";
import Moment from "moment";
import storage from "local-storage-fallback";

class Web {
  constructor() {
    this.JSONrpc = new JSONrpc();
  }

  makeCall(method, options) {
    return this.JSONrpc.call(
      method,
      {
        params: options
      },
      storage.getItem("token")
    )
      .catch(err => {
        if (err.status === 401) {
          storage.removeItem("token");
          location.reload();
          throw new Error("Please re-login.");
        }
        if (err.status)
          throw new Error(`Server returned error [${err.status}]`);
        throw new Error(err.message);
      })
      .then(res => {
        let json = res;
        let result = json.result;
        let error = json.error;
        if (error) {
          throw new Error(error.message);
        }
        if (!Moment(result.uiVersion).isValid()) {
          throw new Error("Invalid UI version in the JSON-RPC response");
        }
        if (
          result.uiVersion !== currentUiVersion &&
          currentUiVersion !== "MINIO_UI_VERSION"
        ) {
          storage.setItem("newlyUpdated", true);
          location.reload();
        }
        return result;
      });
  }

  LoggedIn() {
    return !!storage.getItem("token");
  }

  Login(args) {
    return this.makeCall("Login", args).then(res => {
      storage.setItem("token", `${res.token}`);
      return res;
    });
  }

  Logout() {
    storage.removeItem("token");
    storage.removeItem("region");
  }

  ServerInfo() {
    return this.makeCall("ServerInfo");
  }

  StorageInfo() {
    return this.makeCall("StorageInfo");
  }

  ListBuckets() {
    return this.makeCall("ListBuckets");
  }

  MakeBucket(args) {
    return this.makeCall("MakeBucket", args);
  }

  DeleteBucket(args) {
    return this.makeCall("DeleteBucket", args);
  }

  ListObjects(args) {
    return this.makeCall("ListObjects", args);
  }

  ListObjectsV2(args) {
    return this.makeCall("ListObjectsV2", args);
  }

  ListObjectsRecursive(args) {
    return this.makeCall("ListObjectsRecursive", args);
  }

  PresignedGet(args) {
    return this.makeCall("PresignedGet", args);
  }

  PresignedGetObj(args) {
    return this.makeCall("PresignedGetObj", args);
  }

  PresignedPutObject(args) {
    return this.makeCall("PresignedPutObject", args);
  }

  PutObjectURL(args) {
    return this.makeCall("PutObjectURL", args);
  }

  PutObject(args) {
    return this.makeCall("PutObject", args);
  }

  FputObject(args) {
    return this.makeCall("FputObject", args);
  }

  RemoveObject(args) {
    return this.makeCall("RemoveObject", args);
  }

  GetAuth() {
    return this.makeCall("GetAuth");
  }

  GenerateAuth() {
    return this.makeCall("GenerateAuth");
  }

  SetAuth(args) {
    return this.makeCall("SetAuth", args).then(res => {
      storage.setItem("token", `${res.token}`);
      return res;
    });
  }

  CreateURLToken() {
    return this.makeCall("CreateURLToken");
  }

  GetBucketPolicy(args) {
    return this.makeCall("GetBucketPolicy", args);
  }

  SetBucketPolicy(args) {
    return this.makeCall("SetBucketPolicy", args);
  }

  ListAllBucketPolicies(args) {
    return this.makeCall("ListAllBucketPolicies", args);
  }

  getObjectStat(args) {
    return this.makeCall("GetObjectStat", args);
  }

  getEndpointAndBucketName(args) {
    return this.makeCall("GetEndpointAndBucketName", args);
  }

  getWidgetQueryResult(args) {
    return this.makeCall("GetWidgetQueryResult", args);
  }

  GetPartialObject(args) {
    return this.makeCall("GetPartialObject", args);
  }
}

const web = new Web();

export default web;
