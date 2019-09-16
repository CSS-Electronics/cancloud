import React from "react";
import { connect } from "react-redux";
import Select from "react-select";
import InputFieldSimple from "./InputFieldSimple";
import OutputField from "./OutputField";

import * as actionsEditorTools from "./actions";
import * as actionsAlert from "../alert/actions";

const options = [
  { value: "standard", label: "Standard" },
  { value: "extended", label: "Extended" },
  { value: "pgn", label: "J1939 PGN" }
];

const optionsData = [
  { value: "standard", mask: "7FF", idLength: 11 },
  { value: "extended", mask: "1FFFFFFF", idLength: 29 },
  { value: "pgn", mask: "3FFFF", idLength: 18 }
];

const optionsBase = [
  { value: "hex", label: "HEX" },
  { value: "dec", label: "DEC" }
];

const optionsMatching = [
  { value: "range", label: "Range" },
  { value: "mask", label: "Mask" }
];

function reBase(n, fromBase, toBase) {
  if (fromBase === void 0) {
    fromBase = 10;
  }
  if (toBase === void 0) {
    toBase = 10;
  }
  return parseInt(n.toString(), fromBase).toString(toBase);
}

class FilterModal extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleChangeBase1 = this.handleChangeBase1.bind(this);
    this.handleChangeBase2 = this.handleChangeBase2.bind(this);
    this.handleChangeBase3 = this.handleChangeBase3.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.state = {
      selOption: options[0],
      selOptionMatch: optionsMatching[1],
      input1: "",
      input2: optionsData.filter(p => p.value == "standard")[0].mask,
      input3: "",
      base1: optionsBase[0],
      base2: optionsBase[0],
      base3: optionsBase[0]
    };
  }

  handleChange = selOption => {
    const value = selOption.value;
    const defaultMask = optionsData.filter(p => p.value == value)[0].mask;

    this.setState({
      selOption,
      input1: "",
      input2:
        this.state.base2.value == "hex"
          ? defaultMask
          : reBase(defaultMask, 16, 10),
      input3: ""
    });

    if (value == "pgn") {
      this.setState({
        selOptionMatch: optionsMatching[1]
      });
    }
  };

  handleChangeBase1 = base => {
    this.setState({
      base1: base,
      input1: ""
    });
  };

  handleChangeBase2 = base => {
    const defaultMask = optionsData.filter(
      p => p.value == this.state.selOption.value
    )[0].mask;

    this.setState({
      base2: base,
      input2:
        this.state.selOptionMatch.value == "mask"
          ? base.value == "hex"
            ? defaultMask
            : reBase(defaultMask, 16, 10)
          : ""
    });
  };

  handleChangeBase3 = base => {
    this.setState({
      base3: base,
      input3: ""
    });
  };

  handleInputChange(event) {
    const target = event.target;
    const id = target.id;
    const maxLength = target.maxLength;
    const base = this.state["base" + id];

    const baseRegex =
      base.value == "hex"
        ? new RegExp(/(^[0-9A-Fa-f]{0,}$)/)
        : new RegExp(/(^[0-9]{0,}$)/);
    const valueBinLength =
      base.value == "hex"
        ? reBase(target.value, 16, 2).length
        : reBase(target.value, 10, 2).length;

    if (valueBinLength <= maxLength && target.value.match(baseRegex) != null) {
      this.setState({
        ["input" + id]: target.value
      });
    }
  }

  handleChangeMatching = selOptionMatch => {
    const defaultMask = optionsData.filter(
      p => p.value == this.state.selOption.value
    )[0].mask;
    const defaultMaskReBased =
      this.state.base2.value == "hex"
        ? defaultMask
        : reBase(defaultMask, 16, 10);

    this.setState(
      {
        selOptionMatch,
        input1: "",
        input2: selOptionMatch.value == "range" ? "" : defaultMaskReBased
      },
      () => {}
    );
  };

  closeModal(e) {
    this.setState({}, () => {
      this.props.toggleFilterSideBar();
    });
  }

  render() {
    const {
      selOption,
      selOptionMatch,
      base1,
      base2,
      base3,
      input1,
      input2,
      input3
    } = this.state;

    const field1Hex = input1
      ? base1.value == "hex"
        ? input1
        : reBase(input1, 10, 16)
      : "";
    const field2Hex = input2
      ? base2.value == "hex"
        ? input2
        : reBase(input2, 10, 16)
      : "";
    const field3Hex = input3
      ? base3.value == "hex"
        ? input3
        : reBase(input3, 10, 16)
      : "";

    const field1Dec = parseInt(reBase(field1Hex, 16, 10));
    const field2Dec = parseInt(reBase(field2Hex, 16, 10));
    const field3Dec = parseInt(reBase(field3Hex, 16, 10));

    const field1Masked =
      field1Hex != "" && field2Hex != "" ? field1Dec & field2Dec : null;
    const field3Masked =
      field3Hex != "" && field2Hex != "" ? field3Dec & field2Dec : null;

    const idLength = optionsData.filter(p => p.value == selOption.value)[0]
      .idLength;

    const headerText1 =
      selOption.value != "pgn"
        ? selOptionMatch.value == "range"
          ? "Start of filter ID range"
          : "Filter ID"
        : "J1939 PGN";

    const headerText2 =
      selOption.value != "pgn"
        ? selOptionMatch.value == "range"
          ? "End of filter ID range"
          : "Filter mask"
        : "J1939 PGN mask";

    const headerText3 = selOption.value != "pgn" ? "Test ID" : "Test J1939 PGN";

    const f1Hex =
      selOption.value != "pgn"
        ? field1Hex.toUpperCase()
        : reBase(
            reBase(field1Dec << 8, 10, 2).padStart(29, "0"),
            2,
            16
          ).toUpperCase();
    const f2Hex =
      selOption.value != "pgn"
        ? field2Hex.toUpperCase()
        : reBase(
            reBase(field2Dec << 8, 10, 2).padStart(29, "0"),
            2,
            16
          ).toUpperCase();

    return (
      <div className="tools-side-bar">
        <button type="button" className="close" onClick={this.closeModal}>
          <span style={{ color: "gray" }}>×</span>
        </button>

        <h4>CAN ID filter entry checker</h4>
        <div className="row no-gutters">
          <div className="form-group pl0 field-string col-md-6">
            ID format
            <Select
              value={selOption}
              options={options}
              onChange={this.handleChange}
              isSearchable={false}
            />{" "}
            <p className="field-description field-description-shift">
              Select the type of ID filter you wish to evaluate.
            </p>
          </div>

          <div className="form-group pl0 field-string col-md-6">
            Matching
            <Select
              value={
                selOption.value == "pgn" ? optionsMatching[1] : selOptionMatch
              }
              options={
                selOption.value == "pgn"
                  ? [optionsMatching[1]]
                  : optionsMatching
              }
              onChange={this.handleChangeMatching}
              isSearchable={false}
            />{" "}
            <p className="field-description field-description-shift">
              Select the filter matching mechanism.
            </p>
          </div>
        </div>

        <div>
          <InputFieldSimple
            headerText={headerText1}
            id="1"
            value={this.state.input1}
            valueBin={
              field1Hex != ""
                ? reBase(field1Hex, 16, 2).padStart(idLength, "0")
                : ""
            }
            idLength={idLength}
            onChange={this.handleInputChange}
            options={optionsBase}
            selOption={base1}
            handleChangeSelect={this.handleChangeBase1}
            comment={
              selOption.value == "pgn" ? (
                <p>Set the filter PGN</p>
              ) : selOptionMatch.value == "range" ? (
                <p>Set the start of the filter ID range.</p>
              ) : (
                <p>Set the filter ID.</p>
              )
            }
          />
        </div>

        <InputFieldSimple
          headerText={headerText2}
          id="2"
          value={this.state.input2}
          valueBin={
            field2Hex != ""
              ? reBase(field2Hex, 16, 2).padStart(idLength, "0")
              : ""
          }
          idLength={idLength}
          onChange={this.handleInputChange}
          options={optionsBase}
          selOption={base2}
          handleChangeSelect={this.handleChangeBase2}
          comment={
            selOptionMatch.value == "range" ? (
              <p>Set the end of the filter ID range.</p>
            ) : (
              <p>Set the filter mask. If 0, no mask is applied.</p>
            )
          }
        />

        <InputFieldSimple
          headerText={headerText3}
          id="3"
          value={this.state.input3}
          valueBin={
            field3Hex != ""
              ? reBase(field3Hex, 16, 2).padStart(idLength, "0")
              : ""
          }
          idLength={idLength}
          onChange={this.handleInputChange}
          options={optionsBase}
          selOption={base3}
          handleChangeSelect={this.handleChangeBase3}
          comment="Set a test ID that is to be evaluated against the filter. Note that this test is done in isolation from any other filters added."
        />
        <hr />

        <div>
          {field1Hex != "" && field2Hex != "" ? (
            <div>
              <OutputField
                headerText={
                  selOptionMatch.value == "mask"
                    ? "Filter CAN ID (HEX)"
                    : "Start of filter ID range (HEX)"
                }
                alertMsg={this.props.showAlert}
                masked={false}
                rows="1"
                value={f1Hex}
                comment="Copy into the corresponding filter entry field"
              />

              <OutputField
                headerText={
                  selOptionMatch.value == "mask"
                    ? "Filter mask (HEX)"
                    : "End of filter ID range (HEX)"
                }
                alertMsg={this.props.showAlert}
                masked={false}
                rows="1"
                value={f2Hex}
                comment="Copy into the corresponding filter entry field"
              />
            </div>
          ) : null}
        </div>

        {field1Hex != "" && field2Hex != "" && field3Hex != "" ? (
          <div>
            {selOptionMatch.value == "mask" ? (
              field1Masked == field3Masked ? (
                <p className="btn-highlight">
                  <i className="fa fa-check" /> &nbsp; The values match
                </p>
              ) : (
                <p className="red-text">
                  <i className="fa fa-times" /> &nbsp;No match
                </p>
              )
            ) : null}
            {selOptionMatch.value == "range" ? (
              field1Dec <= field3Dec && field3Dec <= field2Dec ? (
                <p className="btn-highlight">
                  <i className="fa fa-check" /> &nbsp; The ID is inside the
                  range
                </p>
              ) : (
                <p className="red-text">
                  <i className="fa fa-times" /> &nbsp;The ID is outside the
                  range
                </p>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showAlert: (type, message) =>
      dispatch(actionsAlert.set({ type: type, message: message })),
    toggleFilterSideBar: () =>
      dispatch(actionsEditorTools.toggleFilterSideBar())
  };
};

export default connect(
  null,
  mapDispatchToProps
)(FilterModal);
