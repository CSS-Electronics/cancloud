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
import { connect } from "react-redux";
import humanize from "humanize";
import Moment from "moment";
import ReactHoverObserver from "react-hover-observer";
import { Popover, OverlayTrigger, Button } from "react-bootstrap";
import ObjectItem from "./ObjectItem";
import ObjectActions from "./ObjectActions";
import * as actionsObjects from "./actions";
import { getCheckedList } from "./selectors";

export const ObjectContainer = ({
  object,
  checkedObjectsCount,
  downloadObject,
  objectMeta,
  objectS3MetaStart
}) => {


  const lastModifiedSD = objectMeta && objectMeta.lastModifiedSD 
  const s3MetaStart = objectS3MetaStart && objectS3MetaStart.s3MetaStart
  // if MF4, use partial object based, else use S3 meta timestamp
  const startTime = lastModifiedSD ? lastModifiedSD : s3MetaStart 

  let props = {
    name: object.name,
    contentType: object.contentType,
    size: humanize.filesize(object.size),
    lastModifiedSD:lastModifiedSD,
    startTime: startTime,
    lastModified: Moment(object.lastModified).format("YY-MM-DD HH:mm")
  };

  if (checkedObjectsCount == 0) {
    props.actionButtons = <ObjectActions object={object} />;
  }
  return (
    <React.Fragment>
      <ObjectItem {...props} />
    </React.Fragment>
  );
};

const mapStateToProps = state => {
  return {
    checkedObjectsCount: getCheckedList(state).length
  };
};

export default connect(mapStateToProps)(ObjectContainer);
