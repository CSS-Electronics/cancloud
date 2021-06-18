import React from "react";
import { connect } from "react-redux";
import Dropdown from "react-bootstrap/lib/Dropdown";
import _ from "lodash";
import * as actions from "./actions";

export class SessionMetaDropdown extends React.Component {
  constructor(props) {
    super(props);
  }

  toggleDropdown() {}

  componentWillUnmount() {
    this.props.setSessionMeta([]);
  }

  render() {
    const { sessionMeta, openDropdown } = this.props;

    return (
      <div>
        <Dropdown
          open={openDropdown}
          className="meta-info-dropdown session-dropdown"
          onToggle={this.toggleDropdown.bind(this)}
          id="object-dropdown-toggle"
        >
          <Dropdown.Toggle noCaret />
          <Dropdown.Menu className="dropdown-menu-right">
            {sessionMeta.length ? (
              <table className="table" style={{ minWidth: "400px" }}>
                <thead>
                  <tr>
                    <td scope="col" colSpan="2" style={{ minWidth: "180px" }}>
                      META DATA
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td scope="col">Log file count</td>
                    <td scope="col">{sessionMeta[0].count}</td>
                  </tr>

                  <tr>
                    <td scope="col">Total size</td>
                    <td scope="col">
                      {sessionMeta[0].totalSize} MB{" "}
                      {sessionMeta[0].count > 1 ? (
                        <div style={{ fontStyle: "italic" }}>
                          Min-max: {sessionMeta[0].sizeRange}
                        </div>
                      ) : null}
                    </td>
                  </tr>

                  <tr>
                    <td scope="col">Last modified (S3)</td>
                    <td scope="col">
                      {sessionMeta[0].lastModifiedRange}
                      {sessionMeta[0].lastModifiedDelta ? (
                        <div style={{ fontStyle: "italic" }}>
                          Period: {sessionMeta[0].lastModifiedDelta}{" "}
                        </div>
                      ) : null}
                    </td>
                  </tr>

                  <tr>
                    <td scope="col">Start Time</td>
                    <td scope="col">
                      {sessionMeta[0].timestampRange}
                      {sessionMeta[0].timestampDelta ? (
                        <div style={{ fontStyle: "italic" }}>
                          Period: {sessionMeta[0].timestampDelta}{" "}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="load-meta-info">Loading...</p>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setSessionMeta: (sessionMeta) =>
      dispatch(actions.setSessionMeta(sessionMeta)),
  };
};

export default connect(null, mapDispatchToProps)(SessionMetaDropdown);
