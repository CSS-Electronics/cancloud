import React, { Component } from "react";
import { connect } from "react-redux";
import history from "../history";
import { pathSlice } from "../utils";
import * as dashboardStatusActions from "../dashboardStatus/actions";
import * as browserActions from "./actions";

import {
  DeviceImage,
  DeviceMeta,
  DeviceMetaLogFileChart,
  prepareDeviceData
} from "./metaHeaderModules";

const imageRegex = new RegExp(/^image\.(jpg|JPG|JPEG|png|PNG)$/, "g");

export class DeviceMetaHeaderContainer extends Component {
  constructor(props) {
    super(props);
  }

  dashboard(e) {
    e.preventDefault();
    history.push("/status-dashboard/");
  }

  componentWillReceiveProps(nextProps) {
    const { bucket, prefix } = pathSlice(history.location.pathname);

    if (this.props.currentBucket != nextProps.currentBucket) {
      this.props.clearDataFiles();
      this.props.listLogFiles([bucket]);
    }

    if (
      this.props.list != nextProps.list &&
      nextProps.list.length > 0 &&
      prefix == ""
    ) {
      let imageName = nextProps.list.filter(
        (obj) => obj && obj.name && obj.name.match(imageRegex)
      )[0];

      if (imageName && imageName.name) {
        this.props.fetchDeviceImage(imageName.name);
      } else {
        this.props.setDeviceImage(undefined);
      }
    }
  }

  componentWillMount() {
    const { bucket } = pathSlice(history.location.pathname);
    this.props.clearDataFiles();
    this.props.listLogFiles([bucket]);
    this.props.setDeviceImage(undefined);
  }

  componentWillUnmount() {
    this.props.clearDataFiles();
  }

  render() {
    const { bucket } = pathSlice(history.location.pathname);

    const {
      mf4Objects,
      deviceFileContent,
      configFileCrc32,
      deviceImage,
      deviceFileLastModified
    } = this.props;

    let dataUploadTime = [];
    let barOptions = [];

    if (mf4Objects.length) {
      [dataUploadTime, barOptions] = prepareDeviceData(mf4Objects);
    }

    return (
      <div>
        <div className="row meta-container">
          <DeviceImage deviceImage={deviceImage} />
          <div className="form-group pl0 field-string">
            <DeviceMeta
              deviceFileContent={deviceFileContent}
              configFileCrc32={configFileCrc32}
              deviceFileLastModified={deviceFileLastModified}
            />
            <p className="field-description">
              Device meta data based on the uploaded Device File. You can change
              the Meta name via your Configuration File. Optionally upload a
              picture named "image.jpg" or "image.png" in your device folder to
              display it next to the meta data.
            </p>
          </div>
          <DeviceMetaLogFileChart
            dataUploadTime={dataUploadTime}
            barOptions={barOptions}
            dashboard={this.dashboard.bind(this)}
          />
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  listLogFiles: (devicesFilesInput) =>
    dispatch(dashboardStatusActions.listLogFiles(devicesFilesInput)),
  clearDataFiles: () => dispatch(dashboardStatusActions.clearDataFiles()),
  fetchConfigFileContentAll: (configObjectsUnique) =>
    dispatch(
      dashboardStatusActions.fetchConfigFileContentAll(configObjectsUnique)
    ),
  fetchDeviceFile: (device) => dispatch(browserActions.fetchDeviceFile(device)),
  fetchDeviceImage: (fileName) =>
    dispatch(browserActions.fetchDeviceImage(fileName)),
  setDeviceImage: (deviceImage) =>
    dispatch(browserActions.setDeviceImage(deviceImage)),
});

function mapStateToProps(state) {
  return {
    currentBucket: state.buckets.currentBucket,
    mf4Objects: state.dashboardStatus.mf4Objects,
    deviceFileContent: state.browser.deviceFileContent,
    configFileCrc32: state.dashboardStatus.configFileCrc32,
    list: state.objects.list,
    deviceImage: state.browser.deviceImage,
    deviceFileLastModified: state.browser.deviceFileLastModified
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeviceMetaHeaderContainer);
