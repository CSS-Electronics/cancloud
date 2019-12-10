import React from "react";
import _ from "lodash";
import hexToRgba from "hex-to-rgba";
import { HorizontalBar, Bar, Line, Doughnut } from "react-chartjs-2";

const BaseChart = props => {
  const { datasets, chColors, aspectRatio, chHeight, chartType } = props;

  let chColorsTrans = chColors.map(color =>
    hexToRgba(color, "0.1")
  );

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

  const pieOptions = {
    maintainAspectRatio: aspectRatio,
    tooltips: {
      callbacks: {
        label: function(item, data) {
          return (
            data.datasets[item.datasetIndex].label +
            ": " +
            data.datasets[item.datasetIndex].data[item.index]
          );
        }
      }
    }
  };

  const barOptions = {
    maintainAspectRatio: aspectRatio,
    scales: {
      yAxes: [
        {
          gridLines: { display: false },
          ticks: {
            beginAtZero: true
          }
        }
      ]
    }
  };

  // restructure the dataset to be suitable for the chart types
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
  let datasetsDevice = [];
  let pieLabels = [];

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

    } else {
      datasetsDevice = datasetsDeviceFiltered.map(e => {
        const parameters = _.omit(e, time_stamp, device_serialno);
        return { parameters };
      })[0].parameters; // note: If multiple entries for one device, the top one is selected
      pieLabels = Object.keys(datasetsDevice);
    }

    datasetsAllDevices[i] = {
      label: deviceIds[i],
      data:
        chartType == "line" ? datasetsDevice : Object.values(datasetsDevice),
      borderColor: chartType == "line" ? chColors[i] : "#ffffff",
      backgroundColor:
        chartType == "line"
          ? chColorsTrans[i]
          : (chartType == "bar" || chartType == "horizontal-bar")
          ? chColors[i]
          : chColors,
      hoverBorderColor: chColorsTrans
    };
  }

  if(chartType == "horizontal-bar"){
  console.log(datasetsAllDevices)
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
              labels: pieLabels
            }}
            height={chHeight ? chHeight : null}
            options={pieOptions}
          />
        ) : chartType == "horizontal-bar" ? (
          <HorizontalBar
            data={{
              datasets: datasetsAllDevices,
              labels: pieLabels
            }}
            height={chHeight ? chHeight : null}
            options={barOptions}
          />
        ) : chartType == "bar" ? (
          <Bar
            data={{
              datasets: datasetsAllDevices,
              labels: pieLabels
            }}
            height={chHeight ? chHeight : null}
            options={barOptions}
          />
        ) : null
      ) : null}
    </div>
  );
};

export default BaseChart;
