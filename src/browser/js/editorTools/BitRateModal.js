import React from "react";
import { connect } from "react-redux";
import InputFieldSimple from "./InputFieldSimple";
import OutputField from "./OutputField";

import * as actionsEditorTools from "./actions";
import * as actionsAlert from "../alert/actions";

class BitRateModal extends React.Component {
  constructor(props) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.state = {
      input1: "100",
      input2: "63",
      input3: "16",
      input4: "4"
    };
  }

  handleInputChange(event) {
    const target = event.target;
    const id = target.id;

    this.setState({
      ["input" + id]: target.value
    });
  }

  closeModal(e) {
    this.setState({}, () => {
      this.props.toggleBitRateSideBar();
    });
  }

  render() {
    const input1 = parseInt(this.state.input1);
    const input2 = parseInt(this.state.input2);
    const input3 = parseInt(this.state.input3);
    const input4 = parseInt(this.state.input4);

    const bitRate = 40000000 / input1 / (1 + input2 + input3);
    const bitRateText =
      bitRate < 1000000
        ? Math.round((bitRate / 1000) * 1000) / 1000 + "k"
        : Math.round((bitRate / 1000000) * 1000) / 1000 + "M";
    const samplePoint =
      Math.round(100 * ((1 + input2) / (1 + input2 + input3)) * 1000) / 1000;

    return (
      <div className="tools-side-bar">
        <button type="button" className="close" onClick={this.closeModal}>
          <span style={{ color: "gray" }}>×</span>
        </button>

        <h4>Bit-timing calculator (advanced)</h4>
        <div>
          <InputFieldSimple
            headerText="BRP (Bit Rate Prescaler)"
            id="1"
            value={this.state.input1}
            onChange={this.handleInputChange}
          />
          <InputFieldSimple
            headerText="SEG1 (Time Segment 1 )"
            id="2"
            value={this.state.input2}
            onChange={this.handleInputChange}
          />
          <InputFieldSimple
            headerText="SEG2 (Time Segment 2)"
            id="3"
            value={this.state.input3}
            onChange={this.handleInputChange}
          />
          <InputFieldSimple
            headerText="SJW (Synchronization Jump Width)"
            id="4"
            value={this.state.input4}
            onChange={this.handleInputChange}
          />
        </div>

        <hr />

        {input1 && input2 && input3 && input4 <= input3 ? (
          <div>
            <p>
              Bit-rate: <span className="btn-highlight">{bitRateText}</span>
            </p>
            <p>
              Time quanta (TQ):{" "}
              <span className="btn-highlight">{input2 + input3 + 1}</span>
            </p>
            <p>
              Sample point (%):{" "}
              <span className="btn-highlight">{samplePoint}</span>
            </p>
          </div>
        ) : null}
        {input1 && input2 && input3 && input4 > input3 ? (
          <p>Note: SJW must be smaller than SEG2</p>
        ) : null}
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showAlert: (type, message) =>
      dispatch(actionsAlert.set({ type: type, message: message })),
    toggleBitRateSideBar: () =>
      dispatch(actionsEditorTools.toggleBitRateSideBar())
  };
};

export default connect(
  null,
  mapDispatchToProps
)(BitRateModal);
