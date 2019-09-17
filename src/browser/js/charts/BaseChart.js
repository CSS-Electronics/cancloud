import React from "react";
import _ from "lodash";
import { Line, Doughnut } from "react-chartjs-2";
import hexToRgba from "hex-to-rgba";

const BaseChart = props => {
  const { datasets, chartColors, aspectRatio, chHeight, chartType } = props;

  // set the header labels for use in indexing object properties
  const device_serialno = datasets[0].label;
  const time_stamp = datasets[1].label;
  const parameter = datasets[2].label; // could be extended for multiple parameters
  const datasetsRestructured = [];

  // set chart specific options
  const lineOptions = {
    maintainAspectRatio: aspectRatio,
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
              minute: "MM/DD h:mm"
            }
          }
        }
      ]
    }
  };

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

  // Line chart: Construct array of the data, separated by device (and add labels/colors for each)
  // Pie chart: Construct arrays of parameter labels and values

  let datasetsAllDevices = [];
  let datasetsDevice = [];


  for (let i = 0; i < deviceIds.length; i++) {
    let datasetsDeviceFiltered = datasetsRestructured.filter(
      e => e[device_serialno] == deviceIds[i]
    );

    if (chartType == "line") {
      datasetsDevice = datasetsDeviceFiltered.map(e => {
        const x = e[time_stamp];
        const y = e[parameter];
        return { x, y };
      });

      datasetsAllDevices[i] = {
        label: deviceIds[i],
        data: datasetsDevice,
        borderColor: chartColors[i],
        backgroundColor: hexToRgba(chartColors[i], "0.1")
      };
    } else if (chartType == "pie") {
      datasetsDevice = datasetsDeviceFiltered.map(e => {
        const parameters = _.omit(e, time_stamp, device_serialno);
        return { parameters };
      })[0].parameters;

      datasetsAllDevices[i] = {
        label: Object.keys(datasetsDevice),
        data: Object.values(datasetsDevice),
        borderColor: "#ffffff",
        backgroundColor: chartColors.slice(0,Object.keys(datasetsDevice).length),
        hoverBackgroundColor: chartColors.slice(0,Object.keys(datasetsDevice).length)

      };
    }
  }


  return (
    <div>
      {datasets ? (
        chartType == "line" ? (
          <Line
            data={{
              datasets: datasetsAllDevices
            }}
            height={chHeight ? chHeight : null}
            options={lineOptions}
          />
        ) : chartType == "pie" ? (
          <Doughnut
          
            data={{
              datasets: datasetsAllDevices,
              labels: datasetsAllDevices[0].label
            }}
            height={chHeight ? chHeight : null}
            options={{
              maintainAspectRatio: aspectRatio
            }}
          />
        ) : null
      ) : null}
    </div>
  );
};

export default BaseChart;
