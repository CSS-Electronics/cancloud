import React from "react";
import { ReactGhLikeDiff } from "react-gh-like-diff";
import { connect } from "react-redux";
import "../css/diff2html.min.css";
import Select from "react-select";

const selectOptions = (Files) => {
  Files = _.orderBy(Files, ["name"], ["desc"]);
  return [...Files, ...[{ name: "None" }]].map((File) => ({
    value: File.name,
    label: File.name,
  }));
};

let pastCrc32 = "N/A";

const { detect } = require("detect-browser");
const browser = detect();

let crcBrowserSupport = [
  "chrome",
  "firefox",
  "opera",
  "safari",
  "edge",
].includes(browser.name);

class EditorChangesComparison extends React.Component {
  constructor(props) {
    super(props);
    this.toggleCheckbox = this.toggleCheckbox.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.state = {
      hideWhiteSpace: true,
    };
  }

  toggleCheckbox = () => {
    this.setState({
      hideWhiteSpace: !this.state.hideWhiteSpace,
    });
  };

  handleSelectChange = (selectedValue) => {
    this.props.handleDropdownChange(
      selectedValue.value,
      "Previous Configuration File"
    );
  };

  render() {
    const {
      options,
      selected,
      past,
      current,
      closeChangesModal,
      revisedConfigFile,
      crc32EditorLive,
      isCompareChanges,
      enableDownload,
      s3
    } = this.props;

    let pastCleaned = past && Object.keys(past).length ? JSON.stringify(JSON.parse(past), null, 2) : "";

    if (crcBrowserSupport == 1 && past && Object.keys(past).length) {
      const { crc32 } = require("crc");
      pastCrc32 = crc32(past).toString(16).toUpperCase().padStart(8, "0");
    } else {
      pastCrc32 = "N/A";
    }

    return (
      <div
        className={
          isCompareChanges
            ? "show modal-custom-wrapper"
            : "hidden modal-custom-wrapper"
        }
      >
        <div
          className={
            isCompareChanges ? "show modal-custom" : "hidden modal-custom"
          }
        >
          <div>
            <div className="modal-review-changes-header">
              <button
                type="button"
                className="close"
                onClick={closeChangesModal}
              >
                <span style={{ color: "gray" }}>×</span>
              </button>
              <div className="">
                <h4> Review changes </h4>

                <div className="col-sm-6 zero-padding">
                  <p>
                    Previous Configuration File{" "}
                    <span className="device-file-table">
                      {pastCrc32 ? "[crc32: " + pastCrc32 + "]" : null}
                    </span>
                  </p>
                  <div className="col-sm-8 form-group pl0 field-string">
                    <Select
                      value={selected}
                      options={selectOptions(options)}
                      onChange={this.handleSelectChange}
                      isDisabled={
                        selectOptions(options).length == 1 &&
                        selectOptions(options)[0].value == "None"
                          ? true
                          : false
                      }
                      isSearchable={false}
                    />
                    <p className="field-description">
                      {
                        "This lets you select the benchmark (pre changes) Configuration File for comparison vs. the new updated Configuration File"
                      }
                    </p>
                    <div className="checkbox-white-space">
                      <label className="checkbox-design">
                        <input
                          label="Hide whitespace changes"
                          type="checkbox"
                          checked={this.state.hideWhiteSpace}
                          onChange={this.toggleCheckbox}
                        />{" "}
                        <span>&nbsp;Hide whitespace changes</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 zero-padding">
                  <p>
                    New Configuration File{" "}
                    <span className="device-file-table">
                      {crc32EditorLive
                        ? "[crc32: " + crc32EditorLive + "]"
                        : null}
                    </span>
                  </p>
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
                    matchingMaxComparisons: 5000,
                  }}
                  past={this.state.hideWhiteSpace ? pastCleaned : past}
                  current={JSON.stringify(current, null, 2)}
                />
              </div>
            </div>
          </div>

          <div className="modal-custom-footer">
            <button type="submit" className="btn btn-primary" disabled={!s3}>
              {" "}
              Submit to S3{" "}
            </button>{" "}
            <button
              type="submit"
              onClick={enableDownload}
              className="btn btn-primary ml15"
            >
              {" "}
              Download to disk{" "}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    past: state.editor.configContentPreChange,
    current: state.editor.configContent,
    crc32EditorLive: state.editor.crc32EditorLive,
  };
}

export default connect(mapStateToProps)(EditorChangesComparison);
