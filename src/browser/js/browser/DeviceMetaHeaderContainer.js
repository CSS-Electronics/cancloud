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
  prepareStorageFreeData,
  extractMetaDevice
} from "./metaHeaderModules";


export class DeviceMetaHeaderContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showLogFilesChart: true
    };
  }

  dashboard(e) {
    e.preventDefault();
    history.push("/status-dashboard/");
  }

  switchChartType(e) {
    e.preventDefault();
    this.setState({
      showLogFilesChart: !this.state.showLogFilesChart
    });
  }

  componentWillReceiveProps(nextProps) {
    const { bucket } = pathSlice(history.location.pathname);
    let metaDevice = extractMetaDevice(this.props.serverConfig, bucket);

    if (
      metaDevice &&
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
      mf4Objects,
      storageFreeTimeseries
    } = this.props;
    let metaDevice = "";
    let dataUploadTime = [];
    let barOptions = [];
    let barOptionsStorageFree = [];
    let dataStorageFreeTime = [];

    if (mf4Objects.length) {
      [dataUploadTime, barOptions] = prepareDeviceData(mf4Objects);
    }

    if (storageFreeTimeseries.length) {
      [dataStorageFreeTime, barOptionsStorageFree] = prepareStorageFreeData(storageFreeTimeseries);
    }

    metaDevice = extractMetaDevice(serverConfig, device);

    return (
      <div>
        {metaDevice ? (
          <div
            className={
              serverConfig.devicemeta.display
                ? "row meta-container"
                : "row hidden"
            }
          >
            <DeviceImage
              device={device}
              metaDevice={metaDevice}
              serverImage={serverImage}
            />
            <DeviceMeta device={device} metaDevice={metaDevice} />
            <DeviceMetaLogFileChart
              dataUploadTime={dataUploadTime}
              barOptions={barOptions}
              barOptionsStorageFree={barOptionsStorageFree}
              dashboard={this.dashboard.bind(this)}
              showLogFilesChart={this.state.showLogFilesChart}
              switchChartType={this.switchChartType.bind(this)}
              dataStorageFreeTime={dataStorageFreeTime}
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
  extractStorageFreeTimeSeries: () =>
    dispatch(dashboardStatusActions.extractStorageFreeTimeSeries()),
  clearDataFiles: () => dispatch(dashboardStatusActions.clearDataFiles())
});

function mapStateToProps(state) {
  return {
    serverConfig: state.browser.serverConfig,
    currentBucket: state.buckets.currentBucket,
    serverImage: state.browser.serverImage,
    mf4Objects: state.dashboardStatus.mf4Objects,
    storageFreeTimeseries: state.dashboardStatus.storageFreeTimeseries
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeviceMetaHeaderContainer);
