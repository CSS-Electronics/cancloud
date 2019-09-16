import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import classNames from "classnames";

class OutputField extends React.Component {
  constructor(props) {
    super(props);

    this.textClick = this.textClick.bind(this);
    this.refreshClick = this.refreshClick.bind(this);

    this.state = {
      value: "",
      copied: false
    };
  }

  textClick() {
    this.setState(
      {
        copied: true
      },
      () => {
        this.props.alertMsg(
          "info",
          this.props.headerText + " copied to clipboard"
        );
      }
    );
  }

  refreshClick() {
    this.setState({}, () => {
      this.props.clickRefresh(this.props.device);
    });
  }

  render() {
    return (
      <div className="form-group pl0 field-string">
        <p className="reduced-margin">
          {this.props.headerText}{" "}
          {this.props.clickRefresh ? (
            <button
              onClick={this.refreshClick.bind(this)}
              type="submit"
              className="btn-refresh"
            >
              <i className="fa fa-refresh" />
            </button>
          ) : (
            <b />
          )}
        </p>
        <div className="text-area-hover">
          <CopyToClipboard text={this.props.value} onCopy={this.textClick}>
            <div className="text-area-wrapper row no-gutters reduced-margin">
              <div
                className={classNames({
                  "col-xs-10 text-area-wrapper-right": true,
                  "secret-output": this.props.masked
                })}
              >
                <textarea
                  id={this.props.id}
                  rows={this.props.rows}
                  className="text-area"
                  spellCheck="false"
                  value={this.props.value}
                  onChange={({ target: { value } }) =>
                    this.setState({ value, copied: false })
                  }
                />
              </div>
              <div className="col-xs-2">
                <span className="align-self-end">
                  <button className="btn-copy" type="button">
                    <i className="fa fa-copy" />{" "}
                  </button>
                </span>
              </div>
            </div>
          </CopyToClipboard>
        </div>

        <p className="field-description field-description-shift">
          {this.props.comment}
        </p>
        {this.props.lastModified ? (
          <p className="binary-text-alt-2">
            Updated: {this.props.lastModified}
          </p>
        ) : (
          <div />
        )}
      </div>
    );
  }
}

export default OutputField;
