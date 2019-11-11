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

import React from "react";
import classNames from "classnames";
import BucketDropdown from "./BucketDropdown";
import history from "../history";

export const Bucket = ({ bucket, isActive, selectBucket, serverConfig }) => {
  const loggerRegex = new RegExp(/([0-9A-Fa-f]){8}/g);
  const serverRegex = new RegExp(/server/g);
  let deviceMeta = {};
  let deviceName = "";

  if (
    serverConfig &&
    serverConfig.devicemeta &&
    serverConfig.devicemeta.devices
  ) {
    deviceMeta = serverConfig.devicemeta.devices.filter(
      p => p.serialno === bucket
    )[0];

    if (deviceMeta !== undefined && deviceMeta.name !== undefined) {
      deviceName = " | " + deviceMeta.name;
    }
  }

  return (
    <li
      className={classNames({
        active: isActive,
        "sb-custom-select": isActive
      })}
      style={{ display: bucket != "Home" ? "block" : "none" }}
    >
      <a
        href=""
        onClick={e => {
          e.preventDefault();
          history.push(`/${bucket}`);
          selectBucket(bucket);
        }}
        className={classNames({
          "fesli-loading": false
        })}
        id={bucket}
      >
        {bucket}
        {deviceName}
      </a>
      {bucket.match(loggerRegex) || bucket.match(serverRegex) ? (
        <BucketDropdown bucket={bucket} selectBucket={selectBucket} />
      ) : null}
    </li>
  );
};

export default Bucket;
