import React from "react";
import { connect } from "react-redux";
import BrowseField from "./BrowseField";
import * as actionsEditorTools from "./actions";
import * as actionsAlert from "../alert/actions";

class PartialConfigLoader extends React.Component {
  constructor(props) {
    super(props);
    this.closeModal = this.closeModal.bind(this);

    this.state = {
    };
  }

  closeModal(e) {
    this.setState({}, () => {
      this.props.togglePartialConfigLoaderSideBar();
    });
  }

  render() {
    return (
      <div className="tools-side-bar">
        <button type="button" className="close" onClick={this.closeModal}>
          <span style={{ color: "gray" }}>×</span>
        </button>

        <h4>Partial config loader</h4>
        <br/>
        <BrowseField
          headerText={"Upload partial Configuration File"}
          comment={"Select a JSON file containing a partial Configuration File. This lets you e.g. load a list of transmit messages or filters. The loaded JSON is validated vs. the Rule Schema, after which it can be merged into the editor Configuration File (even if it is not valid)"}
        />
        </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showAlert: (type, message) =>
      dispatch(actionsAlert.set({ type: type, message: message })),
      togglePartialConfigLoaderSideBar: () =>
      dispatch(actionsEditorTools.togglePartialConfigLoaderSideBar())
  };
};

export default connect(
  null,
  mapDispatchToProps
)(PartialConfigLoader)
