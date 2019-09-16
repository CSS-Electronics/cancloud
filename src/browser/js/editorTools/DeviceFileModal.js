import React from "react";
import { connect } from "react-redux";
import DeviceTable from "./DeviceTable";
import * as actionsEditorTools from "../editorTools/actions";

class DeviceFileModal extends React.Component {
  render() {
    const {
      deviceFileContent,
      deviceFileTableOpen,
      deviceFileLastModified,
      toggleDeviceFileTable
    } = this.props;

    return (
      <div>
        {deviceFileContent ? (
          <div
            className={
              deviceFileTableOpen
                ? "show modal-custom-wrapper"
                : "hidden modal-custom-wrapper"
            }
          >
            <div
              className={
                deviceFileTableOpen
                  ? "show modal-custom"
                  : "hidden modal-custom"
              }
            >
              <div className="modal-custom-header">
                <button
                  type="button"
                  className="close"
                  onClick={toggleDeviceFileTable}
                >
                  <span style={{ color: "gray" }}>×</span>
                </button>
                <div className="">
                  <h4>Device info</h4>
                  {deviceFileLastModified ? (
                    <p>Last update of device.json: {deviceFileLastModified}</p>
                  ) : (
                    <div />
                  )}
                </div>
              </div>

              <div
                className="modal-custom-content"
                style={{ paddingLeft: "40px", paddingRight: "40px" }}
              >
                <br />
                <DeviceTable />
              </div>
            </div>
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
    deviceFileTableOpen: state.editorTools.deviceFileTableOpen,
    deviceFileContent: state.editor.deviceFileContent,
    deviceFileLastModified: state.editor.deviceFileLastModified
  };
}

const mapDispatchToProps = dispatch => {
  return {
    toggleDeviceFileTable: () =>
      dispatch(actionsEditorTools.toggleDeviceFileTable())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeviceFileModal);
