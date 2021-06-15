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

const S3Explorer = require("../../sdk/s3explorer");

export default class JSONrpc {
  constructor() {
    this.version = "2.0";
  }

  call(method, options, token) {
    if (!options) {
      options = {};
    }

    if (!options.id) {
      options.id = 1;
    }

    if (!options.params) {
      options.params = {};
    }

    const s3Explorer = new S3Explorer(options.params, token);

    let result;

    switch (method) {
      case "Login":
        result = s3Explorer.getSessionsObject();
        break;
      case "ListBuckets":
        result = s3Explorer.listBuckets(options.params.marker);
        break;
      case "StorageInfo":
        result = s3Explorer.storageInfo();
        break;
      case "ServerInfo":
        result = s3Explorer.listBuckets();
        break;
      case "ListObjects":
        result = s3Explorer.listObjects(
          options.params.bucketName,
          options.params.prefix,
          options.params.marker
        );
        break;
      case "ListObjectsV2":
        result = s3Explorer.listObjectsV2(
          options.params.bucketName,
          options.params.prefix,
          options.params.marker
        );
        break;
      case "ListObjectsRecursive":
        result = s3Explorer.listObjectsRecursive(
          options.params.bucketName,
          options.params.prefix,
          options.params.marker
        );
        break;
      case "MakeBucket":
        result = s3Explorer.makeBucket(options.params.bucketName, "us-east-1");
        break;
      case "DeleteBucket":
        result = s3Explorer.deleteBucket(options.params.bucketName);
        break;
      case "PutObject":
        result = s3Explorer.putObject(
          options.params.objectName,
          options.params.file
        );
        break;
      case "FputObject":
        result = s3Explorer.fPutObject(
          options.params.bucketName,
          options.params.objectName,
          options.params.file
        );
        break;
      case "RemoveObject":
        result = s3Explorer.removeObject(
          options.params.bucketName,
          options.params.objects
        );
        break;
      case "ListAllBucketPolicies":
        result = s3Explorer.listAllBucketPolicies(options.params.bucketName);
        break;
      case "CreateURLToken":
        result = s3Explorer.createURLToken();
        break;
      case "PresignedGet":
        result = s3Explorer.presignedGet(
          options.params.bucket,
          options.params.object,
          options.params.expiry
        );
        break;
      case "PresignedGetObj":
        result = s3Explorer.presignedGetObj(
          options.params.bucket,
          options.params.object,
          options.params.expiry
        );
        break;
      case "PresignedPutObject":
        result = s3Explorer.presignedPutObject(
          options.params.bucketName,
          options.params.objectName,
          options.params.expiry
        );
        break;
      case "GetObjectStat":
        result = s3Explorer.getObjectStat(
          options.params.bucketName,
          options.params.objectName
        );
        break;
      case "GetEndpointAndBucketName":
        result = s3Explorer.getEndpointAndBucketName();
        break;
      case "GetWidgetQueryResult":
        result = s3Explorer.getWidgetQueryResult(
          options.params.dataFileName,
          options.params.sqlExpression
        );
        break;
      case "GetPartialObject":
        result = s3Explorer.getPartialObject(
          options.params.bucketName,
          options.params.objectName,
          options.params.offset,
          options.params.byteLength
        );
        break;
      default:
        result = {};
        break;
    }

    return result;
  }
}
