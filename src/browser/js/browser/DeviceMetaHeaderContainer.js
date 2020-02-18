import React, { Component } from "react";
import { connect } from "react-redux";
import history from "../history";
import { pathSlice } from "../utils";
import * as dashboardStatusActions from "../dashboardStatus/actions";
import {DeviceImage, DeviceMeta, DeviceMetaLogFileChart, prepareDeviceData, prepareStorageFreeData} from  "./metaHeaderModules";


export class DeviceMetaHeaderContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showLogFilesChart: true
    };
  }

  dashboard(e) {
    e.preventDefault();
    console.log(history);
    history.push("/status-dashboard/");
  }

  switchChartType(e){
    e.preventDefault();
    this.setState({
      showLogFilesChart: !this.state.showLogFilesChart
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.currentBucket != nextProps.currentBucket) {
      this.props.clearDataDevices();
      this.props.clearDataFiles();
      this.props.listLogFiles([nextProps.currentBucket]);
    }
  }

  componentWillMount() {
    this.props.clearDataDevices();
    this.props.clearDataFiles();
    this.props.listLogFiles([this.props.currentBucket]);
  }

  componentWillUnmount() {
    this.props.clearDataDevices();
    this.props.clearDataFiles();
  }

  render() {
    const { bucket } = pathSlice(history.location.pathname);
    const device = bucket;

    const { serverConfig, serverImage, mf4Objects, storageFreeTimeseries} = this.props;
    let metaDevice = "";

    let [dataUploadTime, barOptions] = prepareDeviceData(mf4Objects)

    let dataStorageFreeTime = prepareStorageFreeData(storageFreeTimeseries)
    
    if (serverConfig.devicemeta && serverConfig.devicemeta.devices) {
      metaDevice = serverConfig.devicemeta.devices.filter(
        p => p.serialno === device
      )[0];
    }

    return (
      <div>
        {metaDevice ? (
          <div
            className={serverConfig.devicemeta.display ? "row meta-container" : "row hidden"}
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
  clearDataDevices: () => dispatch(dashboardStatusActions.clearDataDevices()),
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
