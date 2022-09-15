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
import { demoMode } from "../utils";
import Files from "react-files";
const { detect } = require('detect-browser')
const browser = detect()

let news = "";

try {
  let newsJson = require("../../schema/news.json");
  news = newsJson.news;
} catch (err) {}

export class Login extends React.Component {
  constructor(props) {
    super(props);

    if (demoMode) {
      try {
        let demo = require("../../schema/demo-credentials.json");
        this.state = demo.demoCredentials;
      } catch (err) {
        this.state = {
          accessKey: "",
          secretKey: "",
          endPoint: "",
          region: "",
          bucketName: "",
          jsonFileName: "",
        };
      }
    } else {
      this.state = {
        accessKey: "",
        secretKey: "",
        endPoint: "",
        region: "",
        bucketName: "",
        jsonFileName: "",
      };
    }

    this.fileReader = new FileReader();

    this.fileReader.onload = (event) => {
      let cfg = JSON.parse(event.target.result);
      let cfgServer =
        cfg.connect && cfg.connect.s3 && cfg.connect.s3.server
          ? cfg.connect.s3.server
          : null;

      if (cfgServer != null) {
        let cfgKeyformat = cfgServer.keyformat;

        if (cfgKeyformat == 0) {
          let cfgEndpoint = cfgServer.endpoint ? cfgServer.endpoint : "";
          let cfgPort = cfgServer.port ? cfgServer.port : "";
          let cfgAccessKey = cfgServer.accesskey ?  cfgServer.accesskey : "";
          let cfgSecretkey = cfgServer.secretkey ? cfgServer.secretkey : "";
          let cfgBucket = cfgServer.bucket ? cfgServer.bucket : "";
          let cfgRegion = cfgServer.region ? cfgServer.region : "";

          let endpoint = ""
          let cfgCloudEndPointTest = cfgEndpoint.substring(cfgEndpoint.length - 3) == "com" ||  cfgEndpoint.substring(cfgEndpoint.length - 3) == "net" || cfgEndpoint.substring(cfgEndpoint.length - 4) == "com/" || cfgEndpoint.substring(cfgEndpoint.length - 4) == "net/"

          if (cfgCloudEndPointTest) {
             endpoint = cfgEndpoint;
          } else {
            // assume MinIO case
             endpoint = cfgEndpoint + ":" + cfgPort;
          }

          try {
            this.setState({
            accessKey: cfgAccessKey,
            secretKey: cfgSecretkey,
            endPoint: endpoint,
            region: cfgRegion,
            bucketName: cfgBucket,

            }, () => {

            });
          } catch (e) {
            this.onFilesError(e);
          }
        }else{
          this.props.showAlert("info", "The S3 secretKey in the Configuration File appears to be encrypted. The S3 details have therefore not been loaded");
        }
      }else{
        this.props.showAlert("info", "Unable to identify S3 server details in the Configuration File");
      }
    };
  }

  onFileChange(file) {
    this.setState({ jsonFileName: file[0].name }, () => {});
  }

  configureGeneral(e) {
    e.preventDefault();
    history.push("/configuration");
  }

  // Handle field changes
  accessKeyChange(e) {
    this.setState({
      accessKey: e.target.value,
    });
  }

  secretKeyChange(e) {
    this.setState({
      secretKey: e.target.value,
    });
  }

  endPointChange(e) {
    this.setState({
      endPoint: e.target.value,
    });
  }

  regionChange(e) {
    this.setState({
      region: e.target.value,
    });
  }

  bucketNameChange(e) {
    this.setState({
      bucketName: e.target.value,
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const { showAlert, history } = this.props;
    let message = "";
    let isMinioServer = this.state.endPoint.substring(this.state.endPoint.length - 6).includes(":")

    if (this.state.accessKey === "") {
      message = "Access Key cannot be empty";
    }
    if (this.state.secretKey === "") {
      message = "Secret Key cannot be empty";
    }
    if (this.state.endPoint === "") {
      message = "End point cannot be empty";
    }
    if (this.state.region === "") {
      message = "Region cannot be empty";
    }
    if (this.state.endPoint === "https://s3.amazonaws.com") {
      message =
        "For AWS S3 endpoints we recommend to use the following syntax: https://s3.[region].amazonaws.com (e.g. https://s3.us-east-1.amazonaws.com)";
    }
    if (this.state.endPoint === "http://s3.amazonaws.com") {
      message =
        "For AWS S3 endpoints we recommend to use the following syntax: http://s3.[region].amazonaws.com (e.g. http://s3.us-east-1.amazonaws.com)";
    }

    
    if (
      this.state.endPoint.substring(0, 5) == "http:" &&
      location.protocol == "https:" && 
      isMinioServer == false
    ) {
      this.props.showAlert("info", "Auto-adjusting endpoint prefix from http:// to https:// to enable login via https:// browser URL")
      let endPointAdj = this.state.endPoint.replace("http://","https://")
      this.setState({
      endPoint: endPointAdj,
      }, () => {

      });

    }
    else if (
      this.state.endPoint.substring(0, 5) == "http:" &&
      location.protocol == "https:"
    ) {
      message =
        "A http:// server cannot be accessed via a https:// browser frontend. Replace https:// with http:// in the CANcloud URL of your browser and hit enter.";
    }


    if (
      this.state.endPoint.substring(0, 5) != "http:" &&
      this.state.endPoint.substring(0, 6) != "https:"
    ) {
      message = "Please add http:// or https:// in front of your endpoint";
    }

    if (
      this.state.endPoint.substring(0, 6) != "https:" &&
      (browser.name == "chrome" || browser.name == "edge") && 
      isMinioServer == true
    ) {
      message = "It looks like you are trying to login to a TLS-disabled MinIO S3 server using a Chrome/Edge browser. This is not possible unless you are self-hosting CANcloud on the S3 server network. You can use Firefox instead - or enable TLS on your MinIO S3 server. See the S3 server documentation details.";
    }

    if (this.state.bucketName === "") {
      message = "Bucket Name is required";
    }

    if (message) {
      showAlert("danger", message);
        // return;
    }

    web
      .Login({
        accessKey: this.state.accessKey,
        secretKey: this.state.secretKey,
        endPoint: this.state.endPoint,
        region: this.state.region,
        bucketName: this.state.bucketName,
      })
      .then((res) => {
        history.push("/");
        // console.log(res);
      })
      .catch((e) => {
        showAlert("danger", e.message + " - press F12 for details. " + message);
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
              value={this.state.region}
              onChange={this.regionChange.bind(this)}
              className="ig-dark"
              label="Region"
              id="region"
              name="region"
              type="text"
              spellCheck="false"
              required="required"
              autoComplete="region"
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
          <br />
          <div>
            <Files
              onChange={(file) => {
                file.length
                  ? (this.onFileChange(file),
                    this.fileReader.readAsText(file[0]))
                  : this.onFilesError;
              }}
              onError={(error) => {
                this.onFilesError(error);
              }}
              accepts={[".json"]}
              multiple={false}
              maxFileSize={10000000}
              minFileSize={0}
              clickable
            >
              <button className="btn btn-dark-gray">Load from config</button>
            </Files>
          </div>

          <br />
          <div className="login-news">{news}</div>
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

const mapDispatchToProps = (dispatch) => {
  return {
    showAlert: (type, message) =>
      dispatch(actionsAlert.set({ type: type, message: message })),
    clearAlert: () => dispatch(actionsAlert.clear()),
    login: (accessKey, secretKey, endPoint, region, bucketName) =>
      dispatch(
        actionsBrowser.login(accessKey, secretKey, endPoint,region, bucketName)
      ),
  };
};

module.exports = connect((state) => state, mapDispatchToProps)(Login);
