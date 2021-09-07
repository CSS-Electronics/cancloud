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
import ObjectItem from "./ObjectItem";
import * as actionsObjects from "./actions";

export const PrefixContainer = ({ object, currentPrefix, selectPrefix, sessionMeta, sessionStartTime }) => {

  const totalSize = sessionMeta && sessionMeta.totalSize 
  const lastModifiedS3 = sessionMeta && sessionMeta.lastModifiedS3 
  const lastModifiedSD = sessionStartTime && sessionStartTime.lastModifiedSD 
  const lastModifiedS3Meta = sessionMeta && sessionMeta.lastModifiedS3Meta
  const totalCount = sessionMeta && sessionMeta.totalCount
  const startTime = lastModifiedSD  ? lastModifiedSD : lastModifiedS3Meta

  const props = {
    name: object.name,
    size: totalSize,
    totalCount: totalCount,
    lastModifiedSD: lastModifiedSD,
    startTime: startTime,
    lastModified: lastModifiedS3,
    contentType: object.contentType,
    onClick: () => selectPrefix(`${currentPrefix}${object.name}`)
  };

  return <ObjectItem {...props} />;
};

const mapStateToProps = (state, ownProps) => {
  return {
    object: ownProps.object,
    currentPrefix: state.objects.currentPrefix
  };
};

const mapDispatchToProps = dispatch => {
  return {
    selectPrefix: prefix => dispatch(actionsObjects.selectPrefix(prefix))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PrefixContainer);
