import React, { Component } from "react";
import { connect } from "react-redux";
import history from "../history";
import { pathSlice } from "../utils";

function DeviceImage(props) {
  const {metaDevice, serverImage} = props

  // Check if the current device has meta data - and if so, if it has an image name
  if (metaDevice.imageurl && serverImage) {
    const deviceImageName = metaDevice.imageurl;

    // Check if the device image name is found in the state array, serverImage, based on a name/URL lookup
    const deviceImage = serverImage.filter(
      p => p.name === deviceImageName
    )[0];

    // If there is no match in the state array, return blank. Also return blank if there's a match, but no result URL fetched
    if (deviceImage == undefined || deviceImage.url == undefined) {
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
        <div className="meta-image">
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
  const {metaDevice} = props

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
                  {metaDevice.group} {metaDevice.subgroup ? "/" + metaDevice.subgroup : ""}
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

export class DeviceMetaHeaderContainer extends Component {
  render() {
    const { serverConfig, serverImage } = this.props;
    const { bucket } = pathSlice(history.location.pathname);
    const device = bucket;
    let metaDevice = ""

    if(serverConfig.devicemeta && serverConfig.devicemeta.devices){
      metaDevice = serverConfig.devicemeta.devices.filter(
        p => p.serialno === device
      )[0];
    }
   
    return (
      <div>
        {metaDevice ? (
          <div
            style={{ position: "relative", height: "100%", width: "100%" }}
            className={serverConfig.devicemeta.display ? "row" : "row hidden"}
          >
            <DeviceImage
              device={device}
              metaDevice={metaDevice}
              serverImage={serverImage}
            />
            <DeviceMeta device={device} metaDevice={metaDevice} />
          </div>
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
