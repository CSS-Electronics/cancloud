import React from "react";
import { ReactGhLikeDiff } from "react-gh-like-diff";
import { connect } from "react-redux";
import "../../css/diff2html.min.css";

class EditorChangesComparison extends React.Component {
  render() {
    return (
      <div>
        <ReactGhLikeDiff
          options={{
            originalFileName: "original_config",
            updatedFileName: "new_config",
            matchWordsThreshold: 0.25,
            matchingMaxComparisons: 5000
          }}
          past={this.props.past}
          current={JSON.stringify(this.props.current, null, 2)}
        />
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
