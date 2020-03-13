import React, { Component } from "react";
import { connect } from "react-redux";
import history from "../history";
import { pathSlice } from "../utils";
import * as dashboardStatusActions from "../dashboardStatus/actions";
import {
  DeviceImage,
  DeviceMeta,
  DeviceMetaLogFileChart,
  prepareDeviceData,
  extractMetaDevice
} from "./metaHeaderModules";


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

    if (
      this.props.currentBucket != "" &&
      this.props.currentBucket != nextProps.currentBucket
    ) {
      this.props.clearDataFiles();
      this.props.listLogFiles([bucket]);
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
      mf4Objects
    } = this.props;
    let metaDevice = "";
    let dataUploadTime = [];
    let barOptions = [];

    if (mf4Objects.length) {
      [dataUploadTime, barOptions] = prepareDeviceData(mf4Objects);
    }
  
    metaDevice = extractMetaDevice(serverConfig, device);
    let display = serverConfig && serverConfig.devicemeta && serverConfig.devicemeta.display 

    return (
      <div>
        {(display == undefined || display == 1) ? (
          <div
            className={
              serverConfig && serverConfig.deviceMeta && !serverConfig.devicemeta.display
                ? "meta-header-height row hidden"
                : "meta-header-height row meta-container"
            }
          >
            {metaDevice ? 
            <DeviceImage
              device={device}
              metaDevice={metaDevice}
              serverImage={serverImage}
            /> : null}

            <DeviceMeta device={device} metaDevice={metaDevice} />
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
  clearDataFiles: () => dispatch(dashboardStatusActions.clearDataFiles())
});

function mapStateToProps(state) {
  return {
    serverConfig: state.browser.serverConfig,
    currentBucket: state.buckets.currentBucket,
    serverImage: state.browser.serverImage,
    mf4Objects: state.dashboardStatus.mf4Objects,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeviceMetaHeaderContainer);
