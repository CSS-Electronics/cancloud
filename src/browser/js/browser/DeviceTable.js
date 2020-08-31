import React, { Component } from "react";
import { connect } from "react-redux";

export class DeviceTable extends React.Component {
  createTable = deviceFileContent => {
    let table = [];

    for (let i = 0; i < Object.keys(deviceFileContent).length; i++) {
      table.push(
        <tr key={i.toString()}>
          <td style={{ minWidth: "150px" }}>
            {JSON.stringify(Object.keys(deviceFileContent)[i]).replace(
              /"/g,
              ""
            )}
          </td>
          <td style={{ padding: "0px" }}>
            {JSON.stringify(Object.values(deviceFileContent)[i]).replace(
              /"/g,
              ""
            )}
          </td>
        </tr>
      );
    }
    return table;
  };

  render() {
    console.log(this.props.deviceFileContent)
    return (
      <table>
        <tbody className="device-file-table">
          {this.createTable(this.props.deviceFileContent)}
        </tbody>
      </table>
    );
  }
}

function mapStateToProps(state) {
  return {
    deviceFileContent: state.browser.deviceFileContent
  };
}

export default connect(mapStateToProps)(DeviceTable);
