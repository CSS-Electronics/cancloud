import React from "react";

const BaseTable = props => {
  const { datasets, chColors, chartType, fontSize, chHeight } = props;

  if (datasets.length == 0) {
    return (
      <div>
        <p className="widget-no-data">
          The widget configuration did not yield any data
        </p>
      </div>
    );
  }

  // set the header labels for use in indexing object properties
  const device_serialno = datasets[0].label;
  const time_stamp = datasets[1].label;
  const datasetsRestructured = [];
  let tableData = [];
  let tableHeader = [];
  let tableValues = [];

  datasets.map(element =>
    element.data.map(
      (e, i) =>
        (datasetsRestructured[i] = {
          ...datasetsRestructured[i],
          [element.label]: e
        })
    )
  );

  if (chartType == "table") {
    tableData = datasetsRestructured.map(e => {
      const data = _.omit(e, time_stamp, device_serialno);
      return { data };
    });

    tableHeader = (
      <tr>
        {Object.keys(tableData[0].data).map((e, index) => {
          return (
            <th className="widget-table-head" key={"tableHeader " + index}>
              <b>{e}</b>
            </th>
          );
        })}
      </tr>
    );

    tableValues = tableData.map((e, index) => {
      return (
        <tr key={"tableRow " + index}>
          {Object.values(e.data).map((v, index) => {
            return <td key={"tableCell " + index}>{v}</td>;
          })}
        </tr>
      );
    });
  }

  return (
    <div>
      {chartType == "kpi" ? (
        <div className="widget-kpi" style={{ color: chColors[0] }}>
          {datasets[2].data[0]}
        </div>
      ) : chartType == "table" ? (
        <div className="widget-table" style={{ fontSize: fontSize, height:chHeight }}>
          <table className="table">
            <thead>{tableHeader}</thead>
            <tbody className="widget-table-table">{tableValues}</tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default BaseTable;
