import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import EditorToolButton from "./EditorToolButton";
import * as actionsEditor from "../editor/actions";
import * as actionsEditorTools from "./actions";

export class EditorSubMenuInput extends React.Component {
  constructor(props) {
    super(props);
    this.toolsToggleCrcSideBar = this.toolsToggleCrcSideBar.bind(this);
    this.toolsToggleFilterSideBar = this.toolsToggleFilterSideBar.bind(this);
    this.toolsToggleEncryptionSideBar = this.toolsToggleEncryptionSideBar.bind(
      this
    );
    this.toolsToggleSchemaSideBar = this.toolsToggleSchemaSideBar.bind(this);
    this.toolsToggleBitRateSideBar = this.toolsToggleBitRateSideBar.bind(this);
    this.toolsTogglePartialConfigLoaderSideBar = this.toolsTogglePartialConfigLoaderSideBar.bind(
      this
    );
  }

  toolsToggleCrcSideBar() {
    if (this.props.crcSidebarOpen == false) {
      this.props.closeEditorToolsSideBars();
    }
    this.props.toggleCrcSideBar();
    this.props.setConfigContentPreSubmit();
  }

  toolsToggleBitRateSideBar() {
    if (this.props.bitRateSidebarOpen == false) {
      this.props.closeEditorToolsSideBars();
    }
    this.props.toggleBitRateSideBar();
    this.props.setConfigContentPreSubmit();
  }

  toolsToggleSchemaSideBar() {
    if (this.props.editorSchemaSidebarOpen == false) {
      this.props.closeEditorToolsSideBars();
    }
    this.props.toggleEditorSchemaSideBar();
    this.props.setConfigContentPreSubmit();
  }

  toolsToggleEncryptionSideBar() {
    if (this.props.encryptionSidebarOpen == false) {
      this.props.closeEditorToolsSideBars();
    }
    this.props.toggleEncryptionSideBar();
    this.props.setConfigContentPreSubmit();
  }

  toolsToggleFilterSideBar() {
    if (this.props.filterSidebarOpen == false) {
      this.props.closeEditorToolsSideBars();
    }
    this.props.toggleFilterSideBar();
    this.props.setConfigContentPreSubmit();
  }

  toolsTogglePartialConfigLoaderSideBar() {
    if (this.props.partialConfigLoaderSidebarOpen == false) {
      this.props.closeEditorToolsSideBars();
    }
    this.props.togglePartialConfigLoaderSideBar();
    this.props.setConfigContentPreSubmit();
  }

  render() {
    return (
      <div>
        <EditorToolButton
          onClick={this.toolsToggleEncryptionSideBar}
          comment="Encryption tool"
          className="fa fa-lock"
        />{" "}
        {EDITOR.offline ? null : (
          <div>
            <EditorToolButton
              onClick={this.toolsToggleCrcSideBar}
              comment="Config checksum"
              className="fa fa-hashtag"
            />{" "}
          </div>
        )}
        <EditorToolButton
          onClick={this.toolsToggleFilterSideBar}
          comment="Filter checker"
          className="fa fa-filter"
        />{" "}
        <EditorToolButton
          onClick={this.toolsTogglePartialConfigLoaderSideBar}
          comment="Partial config loader"
          className="fa fa-plus"
        />{" "}
        <EditorToolButton
          onClick={this.toolsToggleBitRateSideBar}
          comment="Bit-time calculator"
          className="fa fa-calculator"
        />{" "}
        <div className="field-integer" style={{ float: "left" }}>
          <a
            onClick={this.toolsToggleSchemaSideBar}
            className="editor-schema-button"
          >
            &nbsp;&nbsp;{this.props.menuSchemaName} |{" "}
            {this.props.menuConfigName}
          </a>
          <p className="btn-field-description field-description-shift">Schema & config loader</p>
        </div>
      </div>
    );
  }
}

export class EditorSubMenu extends React.Component {
  render() {
    const {
      toggleEncryptionSideBar,
      toggleBitRateSideBar,
      bitRateSidebarOpen,
      partialConfigLoaderSidebarOpen,
      closeEditorToolsSideBars,
      toggleCrcSideBar,
      toggleEditorSchemaSideBar,
      toggleFilterSideBar,
      togglePartialConfigLoaderSideBar,
      crcSidebarOpen,
      filterSidebarOpen,
      encryptionSidebarOpen,
      setConfigContentPreSubmit,
      editorSchemaSidebarOpen
    } = this.props;

    return (
      <EditorSubMenuInput
        toggleEncryptionSideBar={toggleEncryptionSideBar}
        closeEditorToolsSideBars={closeEditorToolsSideBars}
        toggleBitRateSideBar={toggleBitRateSideBar}
        bitRateSidebarOpen={bitRateSidebarOpen}
        partialConfigLoaderSidebarOpen={partialConfigLoaderSidebarOpen}
        toggleCrcSideBar={toggleCrcSideBar}
        toggleEditorSchemaSideBar={toggleEditorSchemaSideBar}
        toggleFilterSideBar={toggleFilterSideBar}
        togglePartialConfigLoaderSideBar={togglePartialConfigLoaderSideBar}
        crcSidebarOpen={crcSidebarOpen}
        filterSidebarOpen={filterSidebarOpen}
        encryptionSidebarOpen={encryptionSidebarOpen}
        editorSchemaSidebarOpen={editorSchemaSidebarOpen}
        setConfigContentPreSubmit={setConfigContentPreSubmit}
        menuSchemaName={this.props.menuSchemaName}
        menuConfigName={this.props.menuConfigName}
      />
    );
  }
}

const mapStateToProps = state => {
  return {
    encryptionSidebarOpen: state.editorTools.encryptionSidebarOpen,
    crcSidebarOpen: state.editorTools.crcSidebarOpen,
    filterSidebarOpen: state.editorTools.filterSidebarOpen,
    bitRateSidebarOpen: state.editorTools.bitRateSidebarOpen,
    editorSchemaSidebarOpen: state.editorTools.editorSchemaSidebarOpen,
    partialConfigLoaderSidebarOpen: state.editorTools.partialConfigLoaderSidebarOpen
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleEncryptionSideBar: () =>
      dispatch(actionsEditorTools.toggleEncryptionSideBar()),
    toggleCrcSideBar: () => dispatch(actionsEditorTools.toggleCrcSideBar()),
    toggleFilterSideBar: () =>
      dispatch(actionsEditorTools.toggleFilterSideBar()),
    toggleEditorSchemaSideBar: () =>
      dispatch(actionsEditorTools.toggleEditorSchemaSideBar()),
    toggleBitRateSideBar: () =>
      dispatch(actionsEditorTools.toggleBitRateSideBar()),
    togglePartialConfigLoaderSideBar: () =>
      dispatch(actionsEditorTools.togglePartialConfigLoaderSideBar()),
    closeEditorToolsSideBars: () =>
      dispatch(actionsEditorTools.closeEditorToolsSideBars()),
    setConfigContentPreSubmit: () =>
      dispatch(actionsEditor.setConfigContentPreSubmit())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorSubMenu);
