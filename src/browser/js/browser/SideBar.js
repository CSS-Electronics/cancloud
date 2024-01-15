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
import classNames from "classnames";
import ClickOutHandler from "react-onclickout";
import { connect } from "react-redux";
import logo from "../../img/logo-sidebar.png";
// import logo from "../../img/logo.png";
import BucketSearch from "../buckets/BucketSearch";
import BucketList from "../buckets/BucketList";
import Host from "./Host";
import * as actionsCommon from "./actions";
import web from "../web";
import history from "../history";
import { pathSlice } from "../utils";
import { demoMode, demoDate } from "../utils";

export const SideBar = ({
  sidebarOpen,
  clickOutside,
  endPoint,
  bucketName,
}) => {
  const { bucket, prefix } = pathSlice(history.location.pathname);

  return (
    <ClickOutHandler onClickOut={clickOutside}>
      <div
        className={classNames({
          "fe-sidebar": true,
          "sb-custom": true,
          toggled: sidebarOpen,
        })}
      >
        <div className="fes-header clearfix hidden-sm hidden-xs">
        <img src={logo} style={{ width: "65%", maxHeight: "70px" }} />


          <div className="version-text sb-custom-version">
            v05.08.11
            {demoMode ? (
              <div>
                <br />
                DEMO MODE (date fixed at {demoDate.split(" ")[0]})
                <br /><br />
                Open the official & latest CANcloud <a href="https://canlogger.csselectronics.com/cancloud/">here</a>
              </div>
            ) : null}
          </div>
        </div>
        <div className="fes-list">
          {web.LoggedIn() && <BucketSearch />}
          <BucketList />
        </div>
        <Host endPoint={endPoint} bucketName={bucketName} />
      </div>
    </ClickOutHandler>
  );
};

const mapStateToProps = (state) => {
  return {
    sidebarOpen: state.browser.sidebarOpen,
    endPoint: state.buckets.endPoint,
    bucketName: state.buckets.bucketName,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    clickOutside: () => dispatch(actionsCommon.closeSidebar()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SideBar);
