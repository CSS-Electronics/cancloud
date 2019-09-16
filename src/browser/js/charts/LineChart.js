import React from "react";
import { Line } from "react-chartjs-2";
import hexToRgba from "hex-to-rgba";
import Moment from "moment";

let lineChartColors = [
  "#3d85c6",
  "#073763",
  "#0b5394",
  "#6fa8dc",
  "#9fc5e8",
  "#e69138",
  "#ff9900",
  "#f6b26b",
  "#f9cb9c"
];


const LineChart = ({ datasets }) => {

  // set the header labels for use in indexing object properties
  const device_serialno = datasets[0].label
  const time_stamp = datasets[1].label
  const parameter = datasets[2].label
  const datasetsRestructured = [];

  // restructure the dataset to be suitable for Line/Scatter types
  datasets.map(element =>
    element.data.map(
      (e, i) =>
        (datasetsRestructured[i] = {
          [element.label]: e,
          ...datasetsRestructured[i]
        })
    )
  );

  // get unique set of device IDs available in the data
  const deviceIds = [
    ...new Set(datasetsRestructured.map(x => x[device_serialno]))
  ];

  // construct array of the data, separated by device (and add labels/colors for each)
  let datasetsAllDevices = [];
  for (let i = 0; i < deviceIds.length; i++) {
    let datasetsDevice = datasetsRestructured
      .filter(e => e[device_serialno] == deviceIds[i])
      .map(e => {
        const x = Moment(e[time_stamp]).format("MM/DD h:mm:ss");
        const y = e[parameter];
        return { x, y };
      });

    datasetsAllDevices[i] = {
      label: deviceIds[i],
      data: datasetsDevice,
      borderColor: lineChartColors[i],
      backgroundColor: hexToRgba(lineChartColors[i], "0.1")
    };
  }

  return (
    <div>
      {datasets ? (
        <Line
          data={{
            datasets: datasetsAllDevices
          }}
          options={{
            scales: {
              xAxes: [
                {
                  gridLines: {
                    display: false
                  },
                  type: "time",
                  time: {
                    unit: "minute",
                    unitStepSize: 1,
                    displayFormats: {
                      second: "MM/DD h:mm:ss",
                      minute: "MM/DD h:mm",
                    }
                  }
                }
              ]
            }
          }}
        />
      ) : null}
    </div>
  );
};

export default LineChart;
