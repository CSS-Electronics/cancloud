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

export const Bucket = ({ bucket, isActive, selectBucket, bucketsMeta, listLogFiles }) => {
  const loggerRegex = new RegExp(/([0-9A-Fa-f]){8}/g);
  let deviceName = "";

  if(bucketsMeta && bucketsMeta.length > 0){
    deviceName = bucketsMeta.filter(obj => obj.split(" ")[0] == bucket)[0].split(" | ")[0].replace(" "," | ")
    deviceName = deviceName.length > 30 ? deviceName.substr(0,30) + " ..." : deviceName
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
        {deviceName}
      </a>
      {bucket.match(loggerRegex) ? (
        <BucketDropdown bucket={bucket} selectBucket={selectBucket} />
      ) : null}
    </li>
  );
};

export default Bucket;
