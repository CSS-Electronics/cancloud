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
import { connect } from "react-redux";
import logo from "../../img/logo.png";
import Alert from "../alert/Alert";
import * as actionsAlert from "../alert/actions";
import * as actionsBrowser from "./actions";
import InputGroup from "./InputGroup";
import web from "../web";
import { Redirect } from "react-router-dom";
import history from "../history";
import {demoMode} from "../utils";

export class Login extends React.Component {
  constructor(props) {
    super(props);

    if(demoMode){
      try{
      let demo = require("../../schema/demo-credentials.json")
      this.state = demo.demoCredentials
      }
      catch(err){
        this.state = {
          accessKey: "",
          secretKey: "",
          endPoint: "",
          bucketName: ""
        };
      }
    }else{
      this.state = {
        accessKey: "",
        secretKey: "",
        endPoint: "",
        bucketName: ""
      };
    }


    // LIVE DEMO
  }

  configureGeneral(e) {
    e.preventDefault();
    history.push("/configuration");
  }

  // Handle field changes
  accessKeyChange(e) {
    this.setState({
      accessKey: e.target.value
    });
  }

  secretKeyChange(e) {
    this.setState({
      secretKey: e.target.value
    });
  }

  endPointChange(e) {
    this.setState({
      endPoint: e.target.value
    });
  }

  bucketNameChange(e) {
    this.setState({
      bucketName: e.target.value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const { showAlert, history } = this.props;
    let message = "";
    if (this.state.accessKey === "") {
      message = "Access Key cannot be empty";
    }
    if (this.state.secretKey === "") {
      message = "Secret Key cannot be empty";
    }
    if (this.state.endPoint === "") {
      message = "End point cannot be empty";
    }
    if (
      this.state.endPoint.substring(0, 5) == "http:" &&
      location.protocol == "https:"
    ) {
      message =
        "A http:// server cannot be accessed via a https:// browser frontend";
    }
    if (
      this.state.endPoint.substring(0, 5) != "http:" &&
      this.state.endPoint.substring(0, 6) != "https:"
    ) {
      message =
        "Please add http:// or https:// in front of your endpoint";
    }
    if (this.state.bucketName === "") {
      message = "Bucket Name is required";
    }

    if (message) {
      showAlert("danger", message);
      return;
    }

    web
      .Login({
        accessKey: this.state.accessKey,
        secretKey: this.state.secretKey,
        endPoint: this.state.endPoint,
        bucketName: this.state.bucketName
      })
      .then(res => {
        history.push("/");
      })
      .catch(e => {
        showAlert("danger", e.message);
      });
  }

  componentWillMount() {
    const { clearAlert } = this.props;
    // Clear out any stale message in the alert of previous page
    clearAlert();
    document.body.classList.add("is-guest");
  }

  componentWillUnmount() {
    document.body.classList.remove("is-guest");
  }

  render() {
    const { clearAlert, alert } = this.props;
    if (web.LoggedIn()) {
      return <Redirect to={"/"} />;
    }
    let alertBox = <Alert {...alert} onDismiss={clearAlert} />;
    // Make sure you don't show a fading out alert box on the initial web-page load.
    if (!alert.message) alertBox = "";
    return (
      <div className="login login-custom">
        {alertBox}
        <div className="l-wrap">
          <form onSubmit={this.handleSubmit.bind(this)} noValidate>
            <br />
            <br />
            <br />
            <InputGroup
              value={this.state.endPoint}
              onChange={this.endPointChange.bind(this)}
              className="ig-dark"
              label="End Point"
              id="endPoint"
              name="endpoint"
              type="text"
              spellCheck="false"
              required="required"
              autoComplete="endPoint"
            />
            <InputGroup
              value={this.state.accessKey}
              onChange={this.accessKeyChange.bind(this)}
              className="ig-dark"
              label="Access Key"
              id="accessKey"
              name="username"
              type="text"
              spellCheck="false"
              required="required"
              autoComplete="username"
            />
            <InputGroup
              value={this.state.secretKey}
              onChange={this.secretKeyChange.bind(this)}
              className="ig-dark"
              label="Secret Key"
              id="secretKey"
              name="password"
              type="password"
              spellCheck="false"
              required="required"
              autoComplete="new-password"
            />

            <InputGroup
              value={this.state.bucketName}
              onChange={this.bucketNameChange.bind(this)}
              className="ig-dark"
              label="Bucket Name"
              id="bucketName"
              name="bucketName"
              type="text"
              spellCheck="false"
              required="required"
              autoComplete="bucketName"
            />

            <button className="lw-btn" type="submit">
              <i className="fa fa-sign-in" />
            </button>
          </form>
        </div>
        <div className="l-footer">
          <a className="lf-logo" href="">
            <img src={logo} alt="" />
          </a>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showAlert: (type, message) =>
      dispatch(actionsAlert.set({ type: type, message: message })),
    clearAlert: () => dispatch(actionsAlert.clear()),
    login: (accessKey, secretKey, endPoint, bucketName) =>
      dispatch(actionsBrowser.login(accessKey, secretKey, endPoint, bucketName))
  };
};

module.exports = connect(
  state => state,
  mapDispatchToProps
)(Login);
