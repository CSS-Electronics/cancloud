/*
 * Minio Cloud Storage (C) 2016, 2018 Minio, Inc.
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
import ObjectContainer from "./ObjectContainer";
import PrefixContainer from "./PrefixContainer";

export const ObjectsList = ({ objects, sessionMetaList, sessionStartTimeList, sessionObjectsMetaList, objectsS3MetaStart }) => {
  const list = objects.map(object => {

    
    if (object.name.endsWith("/")) {
      const sessionMeta = sessionMetaList.filter(session => session.prefix == object.name)[0]
      const sessionStartTime = sessionStartTimeList.filter(session => session.prefix == object.name)[0]
      return <PrefixContainer object={object} key={object.name} sessionMeta={sessionMeta} sessionStartTime={sessionStartTime} />;
    } else {
      const objectMeta = sessionObjectsMetaList.filter(objectMeta => objectMeta.name == object.name)[0]
      const objectS3MetaStart = objectsS3MetaStart.filter(objectMeta => objectMeta.name ==  object.name)[0]
      return <ObjectContainer object={object} key={object.name} objectMeta={objectMeta} objectS3MetaStart={objectS3MetaStart} />;
    }
  });
  return <div>{list}</div>;
};

export default ObjectsList;
