import React from "react";
import { connect } from "react-redux";

import Form from "react-jsonschema-form";
import applyNav from "react-jsonschema-form-pagination";
import classNames from "classnames";

import EditorSchemaModal from "../editorBaseTools/EditorSchemaModal";
import PartialConfigLoader from "../editorBaseTools/PartialConfigLoader";

import EditorToolButton from "../editorBaseTools/EditorToolButton";
import EditorToolModalWrapper from "../editorBaseTools/EditorToolModalWrapper";

import EditorNavs from "./EditorNavs";
import EditorArrayFieldTemplate from "./EditorArrayFieldTemplate";
import EditorChangesComparison from "./EditorChangesComparison";

import * as actionsEditor from "./actions";
import { getFileType } from "./utils";

const regexRevision = new RegExp("\\d{2}\\.\\d{2}\\.json", "g");
let isDownloadConfig = false;
let activatedTab;

export class EditorSection extends React.Component {
  constructor(props) {
    super(props);
    this.editorForm = React.createRef();
    this.handleCompareChanges = this.handleCompareChanges.bind(this);
    this.closeChangesModal = this.closeChangesModal.bind(this);
    this.handleError = this.handleError.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.escFunction = this.escFunction.bind(this);
    this.subMenuBtnClick = this.subMenuBtnClick.bind(this);
    this.handleDropdownChange = this.handleDropdownChange.bind(this);

    this.state = {
      uischema: "",
      schema: "",
      config: "",
      selecteduischema: "",
      selectedschema: "",
      selectedconfig: "",
      configReview: { value: "None", label: "None" },
      revisedConfigFile: {},
      formData: {},
      isSubmitting: false,
      isDownloadConfig: false,
      isCompareChanges: false,
      activeSideBar: "schema-modal",
    };

    this.input = "";
  }

  escFunction(event) {
    if (event.keyCode === 27) {
      this.closeChangesModal();
    }
  }

  subMenuBtnClick(name) {
    let sideBar = this.state.activeSideBar == name ? "none" : name;

    this.setState(
      {
        activeSideBar: sideBar,
      },
      () => {
        this.props.setConfigContentPreSubmit();
      }
    );
  }

  handleDropdownChange(selection, dropdown) {
    const fileType = getFileType(dropdown);
    this.setState(
      {
        [fileType]: selection,
        ["selected" + fileType]: selection,
        [fileType + "Review"]: selection,
      },
      () => {
        if(this.props.fetchFileContentS3 && fileType != "uischema" && !selection.includes("(local)")){
          this.props.fetchFileContentS3(selection, fileType);
        }else{
          // this.props.fetchFileContent(selection, fileType)
        }
      }
    );
  }

  handleCompareChanges(e) {
    this.setState({
      isCompareChanges: !this.state.isCompareChanges,
    });
  }

  closeChangesModal(e) {
    this.setState({
      isCompareChanges: false,
    });
    document.body.style.overflow = "auto";
  }

  enableDownload() {
    isDownloadConfig = true;
  }

  componentWillMount() {
    this.props.publicUiSchemaFiles();
  }

  componentDidMount() {
    document.addEventListener("keydown", this.escFunction, false);
  }

  componentWillUnMount() {
    document.removeEventListener("keydown", this.escFunction, false);
  }

  componentWillReceiveProps(nextProps) {

    let uiLocal = nextProps.editorUISchemaFiles.filter((file) =>
      file.name.includes("(local)")
    );
    let schemaLocal = nextProps.editorSchemaFiles.filter((file) =>
      file.name.includes("(local)")
    );
    let configLocal = nextProps.editorConfigFiles.filter((file) =>
      file.name.includes("(local)")
    );

    if (uiLocal.length) {
      this.setState({
        selecteduischema: uiLocal[0].name,
      });
    }
    if (schemaLocal.length) {
      this.setState({
        selectedschema: schemaLocal[0].name,
      });
    }
    if (configLocal.length) {
      this.setState({
        selectedconfig: configLocal[0].name,
      });
    }

    // Get the initial value for the config review benchmark dropdown
    if (nextProps.editorConfigFiles.length == 0) {
      this.setState({
        configReview: { value: "None", label: "None" },
      });
    }
    if (
      this.props.editorConfigFiles.length !=
        nextProps.editorConfigFiles.length &&
      nextProps.editorConfigFiles[0] &&
      nextProps.editorConfigFiles[0].name
    ) {
      let configName = configLocal.length
        ? configLocal[0].name
        : nextProps.editorConfigFiles[0].name;

      this.setState(
        {
          configReview: { value: configName, label: configName },
        },
        () => {
          this.props.fetchFileContent(configName, "config-review");
        }
      );
    }
  }

  onSubmit({ formData }) {
    if (
      this.props.schemaContent == undefined ||
      this.props.schemaContent == null
    ) {
      this.props.showAlert("info", "No Rule Schema has been loaded");
      return;
    }

    let checkSchemaList = this.props.editorSchemaFiles.length
      ? this.props.editorSchemaFiles[0].name
      : null;

    const checkSchemaUpload = this.props.editorSchemaFiles.filter((file) =>
      file.name.includes("(local)")
    );
    let checkUpload = null;

    if (checkSchemaUpload.length) {
      checkUpload = checkSchemaUpload[0].name.split(" ")[0];
    }

    this.setState(
      {
        schema: checkUpload
          ? checkUpload
          : this.state.schema
          ? this.state.schema
          : checkSchemaList,
        config: this.state.config
          ? this.state.config
          : this.props.editorConfigFiles.length
          ? this.props.editorConfigFiles[0].name
          : null,
        formData,
        isSubmitting: true,
      },
      () => {
        let tempJson = JSON.stringify(formData, null, 2);
        this.props.setConfigContent(JSON.parse(tempJson));

        let revisedConfigFileSchema = this.state.schema;

        let revisedConfigFile = `config-${revisedConfigFileSchema.match(
          regexRevision
        )}`;

        if (this.state.isCompareChanges === false) {
          this.setState({
            isCompareChanges: true,
            revisedConfigFile: {
              value: revisedConfigFile,
              label: revisedConfigFile,
            },
          });
          document.body.style.overflow = "hidden";
        } else {
          if (isDownloadConfig) {
            this.props.saveUpdatedConfiguration(revisedConfigFile, formData);
            isDownloadConfig = false;
            document.body.style.overflow = "auto";
            this.setState({
              isCompareChanges: false,
            });
          }
        }
      }
    );
  }

  handleError(errors) {
    isDownloadConfig = false;
    this.props.showAlert(
      "danger",
      "The config contains validation errors (see top of editor) - please review and try again"
    );
  }

  handleChange = ({ formData }) => {
    this.props.setUpdatedFormData(formData);
  };

  onNavChange = (nav) => {
    activatedTab = nav[0];
  };

  render() {
    const {
      editorSchemaFiles,
      editorConfigFiles,
      editorUISchemaFiles,
      configContent,
      uiContent,
      schemaContent,
      editorTools,
      sideBarPadding
    } = this.props;

    // add navigation bar
    let FormWithNav = schemaContent ? applyNav(Form, EditorNavs) : Form;

    // add the default 'base modals' to the modals list
    let editorToolsFull = editorTools.concat(
      {
        name: "partialconfig-modal",
        comment: "Partial config loader",
        class: "fa fa-plus",
        modal: <PartialConfigLoader showAlert={this.props.showAlert} />,
      },

      {
        name: "schema-modal",
        comment: "Schema & config loader",
        class: "fa fa-cog",
        modal: (
          <EditorSchemaModal
            selecteduischema={this.state.selecteduischema}
            selectedschema={this.state.selectedschema}
            selectedconfig={this.state.selectedconfig}
            editorUISchemaFiles={editorUISchemaFiles}
            editorSchemaFiles={editorSchemaFiles}
            editorConfigFiles={editorConfigFiles}
            handleDropdownChange={this.handleDropdownChange}
          />
        ),
      }
    );

    return (
      <div>
        <div
          className={classNames({
            "config-editor fe-header": true,
            "encryption-padding": this.state.activeSideBar != "none",
          })}
        >
         <header className="top-header-offline" />

          {editorToolsFull.map((modal,idx) => (
            <div
              key={idx}
              style={{
                display: modal.name == this.state.activeSideBar ? "" : "none",
              }}
            >
              <EditorToolModalWrapper
                modal={modal.modal}
                onClick={() => this.subMenuBtnClick("none")}
              />
            </div>
          ))}

          

          <div>
            <br />
            <br />
            <br />
            <br />

            <div >
              <FormWithNav
                omitExtraData={true}
                liveOmit={true}
                liveValidate={true}
                noHtml5Validate={true}
                schema={schemaContent ? schemaContent : {}}
                uiSchema={uiContent ? uiContent : {}}
                formData={configContent ? configContent : {}}
                onSubmit={this.onSubmit}
                onChange={this.handleChange}
                onError={this.handleError}
                onNavChange={this.onNavChange.bind(this)}
                ArrayFieldTemplate={EditorArrayFieldTemplate}
                activeNav={activatedTab}
              >
                <EditorChangesComparison
                  isCompareChanges={this.state.isCompareChanges}
                  revisedConfigFile={this.state.revisedConfigFile}
                  options={editorConfigFiles}
                  selected={this.state.configReview}
                  handleDropdownChange={this.handleDropdownChange}
                  closeChangesModal={this.closeChangesModal}
                  enableDownload={this.enableDownload.bind(this)}
                />

                <div className={classNames({"config-bar":true, "fe-sidebar-shift-offline": !sideBarPadding })}>
                  <div className="col-xs-1" style={{ minWidth: "120px" }}>
                    <button type="submit" className="btn btn-primary">
                      {" "}
                      Review changes{" "}
                    </button>
                  </div>
                  <div className="col-xs-7" style={{ float: "left" }}>
                    {editorToolsFull.map((modal,idx) => (
                      <EditorToolButton
                        key={idx}
                        onClick={() => this.subMenuBtnClick(modal.name)}
                        comment={modal.comment}
                        className={modal.class}
                      />
                    ))}
                  </div>
                </div>

              </FormWithNav>
            </div>
          </div>
        </div>
        <div className="config-bar-background"/>

      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    editorSchemaFiles: state.editor.editorSchemaFiles,
    editorConfigFiles: state.editor.editorConfigFiles,
    editorUISchemaFiles: state.editor.editorUISchemaFiles,
    schemaContent: state.editor.schemaContent,
    configContent: state.editor.configContent,
    uiContent: state.editor.uiContent,
    configContentPreChange: state.editor.configContentPreChange,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchFileContent: (fileName, fileType) =>
      dispatch(actionsEditor.fetchFileContent(fileName, fileType)),
    setConfigContent: (content) =>
      dispatch(actionsEditor.setConfigContent(content)),
    saveUpdatedConfiguration: (filename, content) =>
      dispatch(actionsEditor.saveUpdatedConfiguration(filename, content)),
    setUpdatedFormData: (formData) =>
      dispatch(actionsEditor.setUpdatedFormData(formData)),
    setConfigContentPreSubmit: () =>
      dispatch(actionsEditor.setConfigContentPreSubmit()),
    publicUiSchemaFiles: () => dispatch(actionsEditor.publicUiSchemaFiles()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditorSection);
