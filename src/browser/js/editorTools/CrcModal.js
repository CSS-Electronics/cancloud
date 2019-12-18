import React from "react";
import { connect } from "react-redux";
import OutputField from "./OutputField";
import * as actionsEditor from "../editor/actions";
import * as actionsEditorTools from "../editorTools/actions";
import * as actionsAlert from "../alert/actions";

class CrcModal extends React.Component {
  constructor(props) {
    super(props);
    this.closeModal = this.closeModal.bind(this);
  }

  closeModal(e) {
    this.setState({}, () => {
      this.props.toggleCrcSideBar();
    });
  }

  render() {
    return (
      <div className="tools-side-bar">
        <button type="button" className="close" onClick={this.closeModal}>
          <span style={{ color: "gray" }}>×</span>
        </button>

        <h4>Config checksums</h4>
        <br />
        <OutputField
          headerText="Device loaded config crc32"
          id="crc32Device"
          alertMsg={this.props.showAlert}
          masked={false}
          clickRefresh={this.props.fetchDeviceFile}
          device={this.props.device}
          lastModified={this.props.deviceFileLastModified}
          rows="1"
          value={
            this.props.deviceFileContent &&
            this.props.deviceFileContent["cfg_crc32"]
              ? this.props.deviceFileContent["cfg_crc32"]
              : ""
          }
          comment="This is the checksum (crc32) of the Configuration File currently used by the device. This is useful for comparing against the checksum of the Configuration File on the server (typically the one loaded in the editor pre changes), e.g. to check if an over-the-air configuration update was successful."
        />
        <br />
        <OutputField
          headerText="Editor config crc32 (pre changes)"
          id="crc32EditorPre"
          alertMsg={this.props.showAlert}
          masked={false}
          rows="1"
          value={this.props.crc32EditorPre}
          comment="This is the checksum (crc32) of the configuration file currently loaded in the device editor (pre changes). Typically this matches the Configuration File in your S3 server device folder. If so, you can check if this matches your device config crc32 to e.g. evaluate if an OTA update was performed successfully."
        />
        <br />

        {this.props.deviceFileContent &&
        this.props.deviceFileContent["cfg_crc32"] &&
        this.props.deviceFileContent["cfg_crc32"] == this.props.crc32EditorPre ? (
          <p className="btn-highlight">
            <i className="fa fa-check" /> &nbsp; The editor/device crc32 values match
          </p>
        ) : (
          <div />
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    crc32EditorPre: state.editorTools.crc32EditorPre,
    deviceFileContent: state.editor.deviceFileContent,
    configContent: state.editor.configContent,
    device: state.buckets.currentBucket,
    deviceFileLastModified: state.editor.deviceFileLastModified
  };
}

const mapDispatchToProps = dispatch => {
  return {
    toggleCrcSideBar: () => dispatch(actionsEditorTools.toggleCrcSideBar()),
    showAlert: (type, message) =>
      dispatch(actionsAlert.set({ type: type, message: message })),
    fetchDeviceFile: device => dispatch(actionsEditor.fetchDeviceFile(device))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CrcModal);
