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

import React, { Component } from "react";
import MobileHeader from "./MobileHeader";
import Header from "./Header";
import ObjectsSection from "../objects/ObjectsSection";
import MainActions from "./MainActions";
import BucketPolicyModal from "../buckets/BucketPolicyModal";
import MakeBucketModal from "../buckets/MakeBucketModal";
import UploadModal from "../uploads/UploadModal";
import ObjectsBulkActions from "../objects/ObjectsBulkActions";
import Dropzone from "../uploads/Dropzone";
import DeviceMetaHeaderContainer from "./DeviceMetaHeaderContainer";
import AlertModals from "../alertModals/AlertModals";

import history from "../history";
import { pathSlice } from "../utils";

const loggerRegex = new RegExp(/([0-9A-Fa-f]){8}/);

export class MainContent extends Component {
  render() {
    const { bucket } = pathSlice(history.location.pathname);
    return (
      <div className="fe-body">
        <ObjectsBulkActions />
        <MobileHeader />
        <Dropzone>
          <Header />
          <div className="meta-header">
            {bucket.match(loggerRegex) ? (
              <DeviceMetaHeaderContainer />
            ) : (
              <div />
            )}
          </div>
          <ObjectsSection />
        </Dropzone>
        <MainActions />
        <BucketPolicyModal />
        <MakeBucketModal />
        <UploadModal />
        <AlertModals />
      </div>
    );
  }
}

export default MainContent;
