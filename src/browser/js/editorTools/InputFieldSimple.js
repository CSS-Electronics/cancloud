import React from "react";
import Select from "react-select";

class InputFieldSimple extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="form-group pl0 field-string">
        {this.props.headerText}

        <div className="row">
          <div className={this.props.selOption ? "col-xs-7" : "col-xs-12"}>
            <input
              className="form-control encryption-input"
              id={this.props.id}
              maxLength={this.props.idLength}
              placeholder={this.props.placeholder}
              type="text"
              value={this.props.value.toUpperCase()}
              onChange={this.props.onChange}
            />
          </div>
          {this.props.selOption ? (
            <div className="col-xs-5">
              <Select
                id={this.props.id}
                value={this.props.selOption}
                options={this.props.options}
                onChange={this.props.handleChangeSelect}
                isSearchable={true}
              />
            </div>
          ) : null}
        </div>
        {this.props.valueBin ? (
          <p className="binary-text">Binary: {this.props.valueBin}</p>
        ) : null}
        {this.props.comment ? (
          <div className="field-description field-description-shift">
            {this.props.comment}
          </div>
        ) : null}
      </div>
    );
  }
}

export default InputFieldSimple;
