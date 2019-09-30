import React, { Component } from "react";
import { connect } from "react-redux";
import history from "../history";
import { pathSlice } from "../utils";

function DeviceImage(props) {
  // Get the full META data of current device
  const deviceMetaCurrent = props.serverConfig.devicemeta.devices.filter(
    p => p.serialno === props.currentBucket
  )[0];

  // Check if the current device has meta data - and if so, if it has an image name
  if (
    deviceMetaCurrent !== undefined &&
    deviceMetaCurrent.imageurl !== undefined &&
    props.serverImage !== undefined
  ) {
    const deviceImageName = deviceMetaCurrent.imageurl;

    // Check if the device image name is found in the state array, serverImage, based on a name/URL lookup
    const deviceImage = props.serverImage.filter(
      p => p.name === deviceImageName
    )[0];

    // If there is no match in the state array, return blank. Also return blank if there's a match, but no result URL fetched
    if (deviceImage === undefined || deviceImage.url === undefined) {
      return <div />;
    }

    const deviceImageUrl = deviceImage.url;

    return (
      <div
        style={{
          height: 180,
          float: "left",
          position: "relative"
        }}
      >
        <div style={{ width: 180, height: 180 }}>
          {deviceImageUrl ? (
            <img
              src={deviceImageUrl}
              style={{
                width: 180,
                maxHeight: 180,
                bottom: 25,
                position: "absolute"
              }}
              alt=""
            />
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  } else {
    return <div />;
  }
}

function DeviceMeta(props) {
  let metaDevice = props.serverConfig.devicemeta.devices.filter(
    p => p.serialno === props.currentBucket
  )[0];

  return (
    <div className="col-sm-6">
      {metaDevice ? (
        <div>
          <br />
          <table className="table">
            <tbody>
              <tr>
                <td className="col-md-2">Name</td>
                <td>{metaDevice.name}</td>
              </tr>
              <tr>
                <td className="col-md-2">Group</td>
                <td>
                  {metaDevice.group} / {metaDevice.subgroup}
                </td>
              </tr>
              <tr>
                <td className="col-md-2">Comment</td>
                <td>{metaDevice.comment}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

const DeviceMetaHeader = props => {
  return (
    <div
      style={{ position: "relative", height: "100%", width: "100%" }}
      className={props.serverConfig.devicemeta.display ? "row" : "row hidden"}
    >
      <DeviceImage
        currentBucket={props.currentBucket}
        serverConfig={props.serverConfig}
        serverImage={props.serverImage}
      />
      <DeviceMeta
        currentBucket={props.currentBucket}
        serverConfig={props.serverConfig}
      />
    </div>
  );
};

export class DeviceMetaHeaderContainer extends Component {
  render() {
    const { serverConfig, serverImage } = this.props;
    const { bucket } = pathSlice(history.location.pathname);
    return (
      <div>
        {serverConfig.devicemeta && serverConfig.devicemeta.devices ? (
          <DeviceMetaHeader
            serverConfig={serverConfig}
            currentBucket={bucket}
            serverImage={serverImage}
          />
        ) : (
          <div />
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    serverConfig: state.browser.serverConfig,
    currentBucket: state.buckets.currentBucket,
    serverImage: state.browser.serverImage
  };
}

export default connect(mapStateToProps)(DeviceMetaHeaderContainer);
