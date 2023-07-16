import React from "react";
import { connect } from "react-redux";
import * as actionsAlert from "../alert/actions";
import AlertContainer from "../alert/AlertContainer";
import history from "../history";
import { pathSlice } from "../utils";
import web from "../web";


// import editor and tools
import {EditorSection} from "config-editor-base";
import {
  EncryptionModal,
  FilterModal,
  BitRateModal,
} from "config-editor-tools";

// import other modals
import DeviceFileModal from "../browser/DeviceFileModal"
import SideBar from "../browser/SideBar";
import MobileHeader from "../browser/MobileHeader";
import Header from "../browser/Header";

// import S3 actions
import * as actionsEditorS3 from "./actions";

// define UIschema and Rule Schema names for auto-loading purposes
export const uiSchemaAry = [
  // "uischema-01.06.json | Simple",
  // "uischema-01.06.json | Advanced",
  "uischema-01.07.json | Simple",
  "uischema-01.07.json | Advanced",
];

export const schemaAry = [
  "schema-01.06.json | CANedge2",
  "schema-01.06.json | CANedge1",
  "schema-01.07.json | CANedge2",
  "schema-01.07.json | CANedge1",
  "schema-01.07.json | CANedge3 GNSS",
  "schema-01.07.json | CANedge2 GNSS",
  "schema-01.07.json | CANedge1 GNSS",
];

export const demoMode = false 

class Editor extends React.Component {
  componentWillMount() {
    const { bucket, prefix } = pathSlice(history.location.pathname);
    this.props.fetchFilesS3(prefix);
  }

  componentWillReceiveProps(nextProps) {
    if( this.props.currentBucket != "" && this.props.currentBucket != nextProps.currentBucket ){
      const { bucket, prefix } = pathSlice(history.location.pathname);

      this.props.fetchFilesS3(prefix);
    }
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
        <div className="fe-body">
        <AlertContainer />

          {web.LoggedIn() && <MobileHeader />}
          <Header />

          <DeviceFileModal/>

          <EditorSection
            editorTools={editorTools}
            showAlert={this.props.showAlert}
            sideBarPadding={true}
            uiSchemaAry={uiSchemaAry}
            schemaAry={schemaAry}
            demoMode={demoMode}
            fetchFileContentExt={this.props.fetchFileContentS3}
            updateConfigFileExt={this.props.updateConfigFileS3}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    currentBucket: state.buckets.currentBucket,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showAlert: (type, message) =>
      dispatch(actionsAlert.set({ type: type, message: message })),
    fetchFilesS3: (prefix) => dispatch(actionsEditorS3.fetchFilesS3(prefix)),
    fetchFileContentS3: (prefix,type) => dispatch(actionsEditorS3.fetchFileContentS3(prefix,type)),
    updateConfigFileS3: (content, object) => dispatch(actionsEditorS3.updateConfigFileS3(content, object))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
