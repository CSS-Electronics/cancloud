import React from "react";

class InputField extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: ""
    };
  }

  handleButtonClick(e) {
    this.setState({}, () => {
      this.props.buttonClick(this.state.value);
    });
  }

  render() {
    return (
      <div className="form-group pl0 field-string">
        {this.props.headerText}

        <div className="row">
          <div className="col-xs-8">
            <input
              className="form-control encryption-input"
              id={this.props.id}
              placeholder={this.props.placeholder}
              type="text"
              value={this.state.value}
              onChange={({ target: { value } }) => this.setState({ value })}
            />
          </div>

          <div className="col-xs-4" style={{ padding: "4px" }}>
            <button
              type="button"
              onClick={this.handleButtonClick.bind(this)}
              className="btn btn-primary"
            >
              {" "}
              {this.props.buttonText}{" "}
            </button>
          </div>
        </div>
        <p className="field-description field-description-shift">
          {this.props.comment}
        </p>
      </div>
    );
  }
}

export default InputField;
