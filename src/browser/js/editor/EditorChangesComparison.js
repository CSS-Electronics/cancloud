import React from "react";
import { ReactGhLikeDiff } from "react-gh-like-diff";
import { connect } from "react-redux";
import "../../css/diff2html.min.css";
import Select from "react-select";

const selectOptions = Files => {
  Files = _.orderBy(Files, ["name"], ["desc"]);
  return [...Files, ...[{ name: "None" }]].map(File => ({
    value: File.name,
    label: File.name
  }));
};

class EditorChangesComparison extends React.Component {
  render() {
    const {
      options,
      selected,
      handleReviewConfigChange,
      past,
      current,
      closeChangesModal,
      revisedConfigFile
    } = this.props;

    return (
      <div>
        <div className="modal-review-changes-header">
          <button type="button" className="close" onClick={closeChangesModal}>
            <span style={{ color: "gray" }}>×</span>
          </button>
          <div className="">
            <h4> Review changes </h4>

            <div className="col-sm-6 zero-padding">
              <p>Left: Previous Configuration File</p>
              <div className="col-sm-8 form-group pl0 field-string">
                <Select
                  value={selected}
                  options={selectOptions(options)}
                  onChange={handleReviewConfigChange}
                  isSearchable={false}
                />
                <p className="field-description">
                  {
                    "This lets you select the benchmark (pre changes) Configuration File for comparison vs. the new updated Configuration File"
                  }
                </p>
              </div>
            </div>
            <div className="col-sm-6 zero-padding">
              <p>Right: New Configuration File</p>
              <div className="col-sm-8 form-group pl0 field-string">
                <Select
                  value={revisedConfigFile}
                  readOnly={true}
                  isSearchable={false}
                  isDisabled={true}
                  inputProps={{ readOnly: true }}
                />
                <p className="field-description">
                  {"This will be the name of the new Configuration File"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-custom-content">
          <div>
            <ReactGhLikeDiff
              options={{
                originalFileName: "original_config",
                updatedFileName: "new_config",
                matchWordsThreshold: 0.25,
                matchingMaxComparisons: 5000
              }}
              past={past}
              current={JSON.stringify(current, null, 2)}
            />
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    past: state.editor.configContentPreChange,
    current: state.editor.configContent
  };
}

export default connect(mapStateToProps)(EditorChangesComparison);
