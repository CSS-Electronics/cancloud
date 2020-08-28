/*
 * Minio Cloud Storage (C) 2016, 2017, 2018 Minio, Inc.
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
import { Dropdown } from "react-bootstrap";
import * as actionsBuckets from "../buckets/actions";
import web from "../web";
import history from "../history";

export class BrowserDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.logout = this.logout.bind(this);
  }


  fullScreen(e) {
    e.preventDefault();
    let el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    }
    if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    }
    if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
    if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  }

  logout(e) {
    e.preventDefault();
    this.props.userLogout();
    web.Logout();
    history.replace("/login");
  }

  homeView(e) {
    e.preventDefault();
    history.push("Home");
  }

  dashboard(e) {
    e.preventDefault();
    history.push("/status-dashboard/");
  }

  render() {
    return (
      <li>
        <Dropdown pullRight id="top-right-menu">
          <Dropdown.Toggle noCaret>
            <i className="fa fa-reorder" />
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-right">
            <li>
              <a href="" onClick={this.fullScreen}>
                Fullscreen <i className="fa fa-expand" />
              </a>
            </li>
            <li>
              <a href="" onClick={this.dashboard.bind(this)}>
                Status dashboard <i className="pie-icon" />
              </a>
            </li>
            <li>
              <a href="" id="logout" onClick={this.logout}>
                Sign out <i className="fa fa-sign-out" />
              </a>
            </li>
          </Dropdown.Menu>
        </Dropdown>
      </li>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    userLogout: () => dispatch(actionsBuckets.userLogout())
  };
};

export default connect(null, mapDispatchToProps)(BrowserDropdown);
