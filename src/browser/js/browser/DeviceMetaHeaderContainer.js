import React, { Component } from "react";
import { connect } from "react-redux";
import history from "../history";
import { pathSlice } from "../utils";
import * as dashboardStatusActions from "../dashboardStatus/actions";
import * as browserActions from "./actions"

import {
  DeviceImage,
  DeviceMeta,
  DeviceMetaLogFileChart,
  prepareDeviceData,
  extractMetaDevice
} from "./metaHeaderModules";

const imageRegex = new RegExp(/^image\.(jpg|JPG|JPEG|png|PNG)$/,"g");


export class DeviceMetaHeaderContainer extends Component {
  constructor(props) {
    super(props);
  }

  dashboard(e) {
    e.preventDefault();
    history.push("/status-dashboard/");
  }

  componentWillReceiveProps(nextProps) {
    const { bucket } = pathSlice(history.location.pathname);
    let deviceFile = this.props.deviceFileContents.filter(
      obj => obj.id == bucket
    )[0];
    let cfg_name = deviceFile && deviceFile.cfg_name;
    let configObject = [{ deviceId: bucket, name: bucket + "/" + cfg_name }];

    if (
      this.props.deviceFileContents != nextProps.deviceFileContents ||
      this.props.currentBucket != nextProps.currentBucket
    ) {

      if(!configObject[0].name.includes("undefined")){
        this.props.fetchConfigFileContentAll(configObject);
      }
      
      this.props.clearDataFiles();
      this.props.listLogFiles([bucket]);
    }

    if(this.props.list != nextProps.list && nextProps.list.length > 0){
      this.props.setDeviceImage(undefined)

      let imageName = nextProps.list.filter(obj => obj && obj.name && obj.name.match(imageRegex))[0]
      if(imageName && imageName.name){
        this.props.fetchDeviceImage(imageName.name)
      }
    }
  }

  componentWillMount() {
    const { bucket } = pathSlice(history.location.pathname);
    this.props.clearDataFiles();
    this.props.listLogFiles([bucket]);
  }

  componentWillUnmount() {
    this.props.clearDataFiles();
  }

  render() {
    const { bucket } = pathSlice(history.location.pathname);
    const device = bucket;

    const {
      serverConfig,
      serverImage,
      mf4Objects,
      deviceFileContents,
      configFileCrc32,
      deviceImage
    } = this.props;


    let metaDevice = "";
    let dataUploadTime = [];
    let barOptions = [];

    if (mf4Objects.length) {
      [dataUploadTime, barOptions] = prepareDeviceData(mf4Objects);
    }

    metaDevice = extractMetaDevice(serverConfig, device);
    let display =
      serverConfig &&
      serverConfig.devicemeta &&
      serverConfig.devicemeta.display;

    return (
      <div>
        {display == undefined || display == 1 ? (
          <div
            className={
              serverConfig &&
              serverConfig.deviceMeta &&
              !serverConfig.devicemeta.display
                ? "meta-header-height row hidden"
                : "meta-header-height row meta-container"
            }
          >
            {metaDevice ? (
              <DeviceImage
                deviceImage={deviceImage}
              />
            ) : null}

            <DeviceMeta
              device={device}
              metaDevice={metaDevice}
              deviceFileContents={deviceFileContents}
              configFileCrc32={configFileCrc32}
            />
            <DeviceMetaLogFileChart
              dataUploadTime={dataUploadTime}
              barOptions={barOptions}
              dashboard={this.dashboard.bind(this)}
            />
          </div>
        ) : (
          <div />
        )}
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  listLogFiles: devicesFilesInput =>
    dispatch(dashboardStatusActions.listLogFiles(devicesFilesInput)),
  clearDataFiles: () => dispatch(dashboardStatusActions.clearDataFiles()),
  fetchConfigFileContentAll: configObjectsUnique =>
    dispatch(
      dashboardStatusActions.fetchConfigFileContentAll(configObjectsUnique)
    ),
  fetchDeviceImage: fileName => dispatch(browserActions.fetchDeviceImage(fileName)),
  setDeviceImage: deviceImage => dispatch(browserActions.setDeviceImage(deviceImage))
});

function mapStateToProps(state) {
  return {
    serverConfig: state.browser.serverConfig,
    currentBucket: state.buckets.currentBucket,
    serverImage: state.browser.serverImage,
    mf4Objects: state.dashboardStatus.mf4Objects,
    deviceFileContents: state.dashboardStatus.deviceFileContents,
    configFileCrc32: state.dashboardStatus.configFileCrc32,
    list: state.objects.list,
    deviceImage: state.browser.deviceImage
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeviceMetaHeaderContainer);
