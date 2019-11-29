import React from "react";
import classNames from "classnames";
import { connect } from "react-redux";

import SideBar from "../browser/SideBar";
import EditorMainContent from "./EditorMainContent";
import AlertContainer from "../alert/AlertContainer";
import { pathSlice, isValidDevice } from "../utils";
import history from "../history";
import web from "../web";

import * as actionsEditor from "./actions";
import * as actionsBuckets from "../buckets/actions";
import EncryptionModal from "../editorTools/EncryptionModal";
import CrcModal from "../editorTools/CrcModal";
import DeviceFileModal from "../editorTools/DeviceFileModal";
import FilterModal from "../editorTools/FilterModal";
import BitRateModal from "../editorTools/BitRateModal";
import PartialConfigLoader from "../editorTools/PartialConfigLoader";

class Editor extends React.Component {
  componentWillMount() {
    const { selectBucket, resetFiles, publicUiSchemaFiles } = this.props;
    const { prefix } = pathSlice(history.location.pathname);
    resetFiles();
    selectBucket(prefix);
    if (
      prefix &&
      (isValidDevice(prefix) || prefix == "server") &&
      !web.LoggedIn()
    ) {
      history.push("/login");
    } else if (!prefix) {
      publicUiSchemaFiles();
    }
  }

  render() {
    const {
      encryptionSidebarOpen,
      crcSidebarOpen,
      editorSchemaSidebarOpen,
      filterSidebarOpen,
      bitRateSidebarOpen,
      deviceFileTableOpen,
      partialConfigLoaderSidebarOpen
    } = this.props;
    return (
      <div
        className={classNames({
          "file-explorer": true,
          "encryption-padding":
            editorSchemaSidebarOpen ||
            encryptionSidebarOpen ||
            crcSidebarOpen ||
            filterSidebarOpen ||
            bitRateSidebarOpen ||
            partialConfigLoaderSidebarOpen
        })}
      >
        {!EDITOR.offline && <SideBar />}
        <EditorMainContent />
        <AlertContainer />
        {encryptionSidebarOpen ? <EncryptionModal /> : null}
        {crcSidebarOpen ? <CrcModal /> : null}
        {filterSidebarOpen ? <FilterModal /> : null}
        {bitRateSidebarOpen ? <BitRateModal /> : null}
        {deviceFileTableOpen ? <DeviceFileModal /> : null}
        {partialConfigLoaderSidebarOpen ? <PartialConfigLoader /> : null}

      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    encryptionSidebarOpen: state.editorTools.encryptionSidebarOpen,
    editorSchemaSidebarOpen: state.editorTools.editorSchemaSidebarOpen,
    crcSidebarOpen: state.editorTools.crcSidebarOpen,
    filterSidebarOpen: state.editorTools.filterSidebarOpen,
    bitRateSidebarOpen: state.editorTools.bitRateSidebarOpen,
    deviceFileTableOpen: state.editorTools.deviceFileTableOpen,
    partialConfigLoaderSidebarOpen: state.editorTools.partialConfigLoaderSidebarOpen
  };
};

const mapDispatchToProps = dispatch => {
  return {
    publicUiSchemaFiles: () => dispatch(actionsEditor.publicUiSchemaFiles()),
    selectBucket: (bucket, prefix) =>
      dispatch(actionsBuckets.selectBucket(bucket, prefix)),
    resetFiles: () => dispatch(actionsEditor.resetFiles())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Editor);
