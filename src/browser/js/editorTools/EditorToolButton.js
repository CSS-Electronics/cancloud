import React from "react";

class EditorToolButton extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="field-integer" style={{ float: "left" }}>
        <button
          type="button"
          onClick={this.props.onClick}
          className="dropdown-toggle btn btn-default config-bar-btn"
        >
          {this.props.toggled ? (
            <i className={this.props.classNameAlt} />
          ) : (
            <i className={this.props.className} />
          )}
        </button>
        <p className="btn-field-description field-description-shift">{this.props.comment}</p>
      </div>
    );
  }
}

export default EditorToolButton;
