import React from "react";
import { connect } from "react-redux";
import DeviceTable from "./DeviceTable";
import { Modal, ModalHeader, ModalBody } from "react-bootstrap";

import * as actionsBrowser from "./actions";

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
          <Modal
            show={deviceFileTableOpen}
            animation={false}
            onHide={toggleDeviceFileTable}
            bsSize="large"
            className="preview-modal"
          >
            <ModalHeader className="modal-header-fixed">
              <button className="close" onClick={toggleDeviceFileTable}>
                ×
              </button>
              <div className="">
                <h4>Device info</h4>
                {deviceFileLastModified ? (
                  <p>Last update of device.json: {deviceFileLastModified}</p>
                ) : (
                  <div />
                )}
              </div>
            </ModalHeader>
            <ModalBody className="modal-content-custom">
              <pre className="modal-preview-body">
                <DeviceTable />
              </pre>
            </ModalBody>
            <div className="modal-footer-fixed"></div>
          </Modal>
        ) : (
          <div />
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    deviceFileTableOpen: state.browser.deviceFileTableOpen,
    deviceFileContent: state.browser.deviceFileContent,
    deviceFileLastModified: state.browser.deviceFileLastModified
  };
}

const mapDispatchToProps = dispatch => {
  return {
    toggleDeviceFileTable: () =>
      dispatch(actionsBrowser.toggleDeviceFileTable())
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DeviceFileModal);
