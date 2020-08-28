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
import Path from "../objects/Path";
import BrowserDropdown from "./BrowserDropdown";
import web from "../web";
import history from "../history";

class Header extends React.Component {
  constructor() {
    super();
  }

  moveToLogin() {
    history.push("/login");
  }

  render() {
    const loggedIn = web.LoggedIn();
    return (
      <header className="fe-header top-header">
          <div>
            {loggedIn && <Path />}
            <ul className="feh-actions float-top">
              {loggedIn ? (
                <BrowserDropdown />
              ) : (
                <a
                  className="btn btn-danger btn-login"
                  onClick={this.moveToLogin}
                >
                  Login
                </a>
              )}
            </ul>
          </div>
      </header>
    );
  }
}

export default Header;
