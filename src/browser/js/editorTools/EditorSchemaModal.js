import React from "react";
import { connect } from "react-redux";
import * as actionsEditor from "../editor/actions";
import * as actionsEditorTools from "../editorTools/actions";
import EditorDropdown from "../editor/EditorDropdown";

class EditorSchemaModal extends React.Component {
  constructor(props) {
    super(props);
    this.closeModal = this.closeModal.bind(this);
  }

  closeModal(e) {
    this.setState({}, () => {
      this.props.toggleEditorSchemaSideBar();
    });
  }

  componentDidMount() {
    if (!this.props.editorSchemaSidebarOpen) {
      this.setState({}, () => {
        this.props.toggleEditorSchemaSideBar();
      });
    }
  }

  componentWillUnmount() {
    this.props.resetFiles()
  }


  render() {
    const {
      editorUISchemaFiles,
      editorSchemaFiles,
      editorConfigFiles,
      handleUiSchemaChange,
      handleSchemaChange,
      handleConfigChange,
      handleUplodedUISchema,
      handleUploadedSchema,
      handleUploadedConfig,
      selectedUISchema,
      selectedSchema,
      selectedConfig
    } = this.props;

    return (
      <div className="tools-side-bar">
        <button type="button" className="close" onClick={this.closeModal}>
          <span style={{ color: "gray" }}>×</span>
        </button>
        <h4>Schema & config loader</h4>

        <EditorDropdown
          options={editorUISchemaFiles}
          name="Presentation Mode"
          selected={selectedUISchema}
          onChange={handleUiSchemaChange}
          handleUplodedFile={handleUplodedUISchema}
          customBackground={true}
          comment="The UIschema affects the visual presentation of the editor. It does not impact the Configuration File. It can also be used to hide e.g. advanced settings via a Simple variant - or show all settings via an Advanced variant. The default UIschema can be changed by uploading a UIschema to the server folder."
        />
        <EditorDropdown
          options={editorSchemaFiles}
          name="Rule Schema"
          selected={selectedSchema}
          onChange={handleSchemaChange}
          handleUplodedFile={handleUploadedSchema}
          customBackground={true}
          comment="The Rule Schema serves as a guide for populating the Configuration File - and for automatically validating a Configuration File."
        /><hr/>
        <EditorDropdown
          options={editorConfigFiles}
          name="Configuration File"
          selected={selectedConfig}
          onChange={handleConfigChange}
          handleUplodedFile={handleUploadedConfig}
          comment="The Configuration File contains the settings that will be used on the device."
        />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    toggleEditorSchemaSideBar: () =>
      dispatch(actionsEditorTools.toggleEditorSchemaSideBar()),
    handleUplodedUISchema: file =>
      dispatch(actionsEditor.handleUploadedUISchma(file)),
    handleUploadedSchema: file =>
      dispatch(actionsEditor.handleUploadedSchma(file)),
    handleUploadedConfig: file =>
      dispatch(actionsEditor.handleUploadedConfig(file)),
      resetFiles: () => dispatch(actionsEditor.resetFiles())
  };
};

const mapStateToProps = state => {
  return {
    currentBucket: state.buckets.currentBucket,
    editorSchemaSidebarOpen: state.editorTools.editorSchemaSidebarOpen
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorSchemaModal);
