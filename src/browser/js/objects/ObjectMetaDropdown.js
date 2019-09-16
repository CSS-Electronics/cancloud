import React from "react";
import { connect } from "react-redux";
import Dropdown from "react-bootstrap/lib/Dropdown";
import _ from "lodash";
import * as actions from "./actions";

export class ObjectMetaDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showObjectMetaDropdown: true
    };
  }

  toggleDropdown() {}

  render() {
    const { name, showObjectMetaInfo, openDropdown } = this.props;

    return (
      <div>
        <Dropdown
          open={openDropdown}
          className="meta-info-dropdown"
          onToggle={this.toggleDropdown.bind(this)}
          id="object-dropdown-toggle"
        >
          <Dropdown.Toggle noCaret />
          <Dropdown.Menu className="dropdown-menu-right">
            {showObjectMetaInfo &&
            showObjectMetaInfo.metaInfo &&
            showObjectMetaInfo.metaInfo.metaData ? (
              <table className="table meta-dropdown-table">
                <thead>
                  <tr>
                    <td scope="col" colSpan="2" style={{ minWidth: "180px" }}>
                      META DATA
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {_.keys(showObjectMetaInfo.metaInfo.metaData).map(key => (
                    <tr key={key}>
                      <td scope="col">{key}</td>
                      <td scope="col">
                        {showObjectMetaInfo.metaInfo.metaData[key]}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      {_.isEmpty(showObjectMetaInfo.metaInfo.metaData)
                        ? "No X-AMZ Meta Found"
                        : null}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="load-meta-info">Loading..</p>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    fetchState: name => dispatch(actions.fetchObjectStat(name)),
    resetMetaInfo: () => dispatch(actions.resetMetaInfo())
  };
};

const mapStateToProps = state => {
  return {
    showObjectMetaInfo: state.objects.info // ? state.objects.info.metaInfo.Metadata : null
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ObjectMetaDropdown);
