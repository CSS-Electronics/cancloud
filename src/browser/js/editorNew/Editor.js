import React from "react";
import { connect } from "react-redux";
import classNames from "classnames";

import {
  EncryptionModal,
  FilterModal,
  BitRateModal,
} from "config-editor-tools";

// import EditorSection from "./editorBase/EditorSection";
import {EditorSection} from "config-editor-base";

import * as actionsAlert from "../alert/actions";
import AlertContainer from "../alert/AlertContainer";

// NEW: ***
import DeviceFileModal from "../browser/DeviceFileModal"
import SideBar from "../browser/SideBar";
import MobileHeader from "../browser/MobileHeader";
import Header from "../browser/Header";
import web from "../web";
import * as actionsEditorS3 from "./actions";

import history from "../history";

import { pathSlice } from "../utils";

class Editor extends React.Component {
  componentWillMount() {
    const { bucket, prefix } = pathSlice(history.location.pathname);

    this.props.fetchFilesS3(prefix);
  }

  render() {
    let editorTools = [
      {
        name: "encryption-modal",
        comment: "Encryption tool",
        class: "fa fa-lock",
        modal: <EncryptionModal showAlert={this.props.showAlert} />,
      },
      {
        name: "filter-modal",
        comment: "Filter checker",
        class: "fa fa-filter",
        modal: <FilterModal showAlert={this.props.showAlert} />,
      },
      {
        name: "bitrate-modal",
        comment: "Bit-time calculator",
        class: "fa fa-calculator",
        modal: <BitRateModal showAlert={this.props.showAlert} />,
      }
    ];

    return (
      <div className="file-explorer">
        <SideBar />
        <div
          className={classNames({ "fe-body ": true, "fe-body-offline": false })}
        >
          {web.LoggedIn() && <MobileHeader />}
          <Header />

          <AlertContainer />
          <DeviceFileModal/>

          <EditorSection
            editorTools={editorTools}
            showAlert={this.props.showAlert}
            sideBarPadding={true}
            fetchFileContentS3={this.props.fetchFileContentS3}
            updateConfigFileS3={this.props.updateConfigFileS3}
          />
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    showAlert: (type, message) =>
      dispatch(actionsAlert.set({ type: type, message: message })),
    fetchFilesS3: (prefix) => dispatch(actionsEditorS3.fetchFilesS3(prefix)),
    fetchFileContentS3: (prefix,type) => dispatch(actionsEditorS3.fetchFileContentS3(prefix,type)),
    updateConfigFileS3: (content, object) => dispatch(actionsEditorS3.updateConfigFileS3(content, object))
  };
};

export default connect(null, mapDispatchToProps)(Editor);
