import React from "react";
import { connect } from "react-redux";
import Files from "react-files";
import * as actionsEditor from "../editor/actions";
import * as actionsAlert from "../alert/actions";
import Form from "react-jsonschema-form";

let yourForm;
const merge = require('deepmerge')


class BrowseField extends React.Component {
  constructor(props) {
    super(props);
    this.onReview = this.onReview.bind(this);
    this.onFilesError = this.onFilesError.bind(this);
    this.testMergedFile = this.testMergedFile.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onValidationError = this.onValidationError.bind(this)

    this.state = {
      jsonFile: {},
      jsonFileName: "",
      mergedConfig:{},
      mergedConfigValid: "Unknown"
    };

    this.fileReader = new FileReader();

    this.fileReader.onload = event => {
      try {
        this.setState({ jsonFile: JSON.parse(event.target.result) }, () => {this.testMergedFile()});
      } catch (e) {
        this.onFilesError(e);
      }
    };
  }

  onSubmit(){
    this.setState({ mergedConfigValid: true}, () => { });
  }
  
  onValidationError(){
    this.setState({ mergedConfigValid: false}, () => { });
  }

  testMergedFile(){
    let mergedConfigTemp = merge(this.props.formData, this.state.jsonFile)
    this.setState({ mergedConfig: mergedConfigTemp }, () => {
      yourForm.submit()         
    });

  }

  onFileChange(file) {
    this.setState({ jsonFileName: file[0].name}, () => { });
  }

  onFilesError(error) {
    this.setState({ jsonFile: {}, jsonFileName: ""}, () => {
      this.props.showAlert(
        "info",
        "Invalid JSON file - " + error.message
      );
    });
  }

  onReview() {

    console.log(this.state.mergedConfig)
    this.props.setConfigContent(this.state.mergedConfig);

    this.setState({ jsonFile: {}, jsonFileName: "" }, () => {
      this.props.showAlert(
        "success",
        "Merged partial Configuration File with editor Configuration File"
      );
    });

  }

  render() {
    const { jsonFile, jsonFileName, mergedConfig , mergedConfigValid} = this.state;
    const { formData, schemaContent} = this.props;

    return (
      <div>
      <div className="form-group pl0 field-string">
        <p className="reduced-margin">{this.props.headerText} </p>
        <p className="field-description field-description-shift">
          {this.props.comment}
        </p>
        </div><div>
        {formData? (  <div className="text-area-wrapper row no-gutters reduced-margin">
          <div className="file-dropzone">
            <Files
              onChange={file => {
                file.length
                  ? (this.onFileChange(file),
                    this.fileReader.readAsText(file[0]))
                  : this.onFilesError;
              }}
              onError={error => {
                this.onFilesError(error);
              }}
              accepts={[".json"]}
              multiple={false}
              maxFileSize={10000000}
              minFileSize={0}
              clickable
            >
              <button className="btn btn-primary">Load JSON file</button>
              <div className="browse-file-name">{jsonFileName}</div>
            </Files>
          </div>

          {Object.keys(jsonFile).length ? (
            <div>
              <pre className="browse-file-preview">
                {JSON.stringify(jsonFile, null, 2)}
              </pre>

              {formData ? (
                <div>
                  {mergedConfigValid ? (<span> <p className="btn-highlight"><i className="fa fa-check" /> &nbsp;Merged Configuration File validated</p></span>) : null}
                  {!mergedConfigValid ? (<p className="red-text"><i className="fa fa-times" /> &nbsp;Merged Configuration File is invalid</p>) : null}
                <button className="btn btn-primary" onClick={this.onReview}>
                  Merge files
                </button>
                

                </div>
                ) : null}
            </div>
          ) : null}
        </div>) : <div className="widget-no-data"><br/><p>Pending editor Configuration File ...</p></div>}

      


        <div style={{display:"none"}}>
          {JSON.stringify(mergedConfig,null,2)}
        <Form 
        onError={this.onValidationError}
        schema={schemaContent ? schemaContent : {}}
        formData={mergedConfig ? mergedConfig : {}}
        onSubmit={this.onSubmit} ref={(form) => {yourForm = form;}}/>
        </div>
      </div>
      </div>
    );
  }
}


// export default BrowseField;

const mapStateToProps = state => {
  return {
    formData: state.editor.formData,
    schemaContent: state.editor.schemaContent
  };
};

const mapDispatchToProps = dispatch => {
  return {
    showAlert: (type, message) =>
      dispatch(actionsAlert.set({ type: type, message: message })),
    setConfigContent: content =>
      dispatch(actionsEditor.setConfigContent(content))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrowseField);
