import React, { Component } from "react";
import { Bar } from "react-chartjs-2";
var speedDate = require("speed-date");
import { barOptionsFunc } from "../dashboardStatus/prepareData";

export function DeviceImage(props) {
  const { metaDevice, serverImage } = props;

  // Check if the current device has meta data - and if so, if it has an image name
  if (metaDevice.imageurl && serverImage) {
    const deviceImageName = metaDevice.imageurl;

    // Check if the device image name is found in the state array, serverImage, based on a name/URL lookup
    const deviceImage = serverImage.filter(p => p.name === deviceImageName)[0];

    // If there is no match in the state array, return blank. Also return blank if there's a match, but no result URL fetched
    if (deviceImage == undefined || deviceImage.url == undefined) {
      return <div />;
    }

    const deviceImageUrl = deviceImage.url;

    return (
      <div className="col-sm-2">
        <div className="meta-image">
          {deviceImageUrl ? (
            <img
              src={deviceImageUrl}
              style={{
                width: 180,
                maxHeight: 180,
                bottom: 25,
                position: "absolute"
              }}
            />
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  } else {
    return <div />;
  }
}

export function DeviceMeta(props) {
  const { metaDevice } = props;

  return (
    <div className="col-sm-4">
      {metaDevice ? (
        <div>
          <br />
          <table className="table table-background">
            <tbody>
              <tr>
                <td className="col-md-2">Name</td>
                <td>{metaDevice.name}</td>
              </tr>
              <tr>
                <td className="col-md-2">Group</td>
                <td>
                  {metaDevice.group}{" "}
                  {metaDevice.subgroup ? "/" + metaDevice.subgroup : ""}
                </td>
              </tr>
              <tr>
                <td className="col-md-2">Comment</td>
                <td>{metaDevice.comment}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

export function DeviceMetaLogFileChart(props) {
  if (
    props.dataUploadTime &&
    props.dataUploadTime.datasets &&
    props.dataUploadTime.datasets.length
  ) {
    return (
      <div className="col-sm-6">
        <div className="row">
          <div className="col-sm-7">
            <p>
              {props.showLogFilesChart
                ? "Log file data uploaded last week (MB/hour)"
                : "Free storage left on SD (%)"}
            </p>
          </div>
          <div className="col-sm-5 chart-menu">
            {" "}
            <a href="" onClick={props.switchChartType}>
              {props.showLogFilesChart ? "SD storage" : "log file uploads"}
            </a>{" "}
            |{" "}
            <a href="" onClick={props.dashboard}>
              status dashboard
            </a>
          </div>
        </div>

        <div>
          {props.showLogFilesChart ? (
            <Bar
              data={props.dataUploadTime}
              height={130}
              options={props.barOptions}
            />
          ) : (
            <Bar
              data={props.dataStorageFreeTime}
              height={130}
              options={props.barOptions}
            />
          )}
        </div>
      </div>
    );
  } else {
    return null;
  }
}

let periodHours = 7 * 24;
let periodEndNew = new Date();
let periodStartNew = new Date();
periodStartNew.setTime(periodStartNew.getTime() - periodHours * 60 * 60 * 1000);

let periodStart = speedDate("YYYY-MM-DD HH", periodStartNew);
let periodEnd = speedDate("YYYY-MM-DD HH", periodEndNew);

export const prepareDeviceData = mf4Objects => {
  // filter log files based on time period
  let uploadedPerTime = mf4Objects.reduce((acc, { lastModified, size }) => {
    if (!acc[lastModified]) {
      acc[lastModified] = 0;
    }
    if (!acc[periodEnd]) {
      acc[periodEnd] = 0;
    }
    if (!acc[periodStart]) {
      acc[periodStart] = 0;
    }
    acc[lastModified] =
      Math.round(parseFloat(acc[lastModified] + size) * 100) / 100;
    return acc;
  }, {});

  let dataUploadTime = {
    datasets: [
      {
        type: "bar",
        data: Object.values(uploadedPerTime),
        backgroundColor: "#3d85c6"
      }
    ],
    labels: Object.keys(uploadedPerTime)
  };

  let barOptions = barOptionsFunc(7 * 24, Object.keys(uploadedPerTime));

  return [dataUploadTime, barOptions];
};

export const prepareStorageFreeData = storageFreeTimeseries => {
  let storageFreePerTime = [];
  let storageFreePerTimeObj = {};

  // first, aggregate the data observations to hourly level
  let storageFreePerTimeAry = storageFreeTimeseries.reduce(
    (acc, { lastModified, storageFree }) => {
      const lastModH = speedDate.cached("YYYY-MM-DD HH", lastModified);
      if (!acc) {
        acc = {};
      }
      if (!acc[lastModH]) {
        acc[lastModH] = [];
      }
      acc[lastModH].push(storageFree);

      return acc;
    },
    {}
  );

  if (Object.keys(storageFreePerTimeAry).length != 0) {
    storageFreePerTime = []; // important to initialize to empty before below is called

    let lastModH = "";
    let storageFree = NaN;

    Object.entries(storageFreePerTimeAry).map(object => {
      lastModH = object[0];
      storageFree =
        Math.round(
          (object[1].reduce((a, b) => a + b, 0) / object[1].length) * 100
        ) / 100;

      storageFreePerTime = storageFreePerTime.concat({
        lastModH: lastModH,
        storageFree: storageFree
      });
    });

    // add boundaries to dataset
    if (!storageFreePerTime[periodStart]) {
      storageFreePerTime = storageFreePerTime.concat({
        lastModH: periodStart,
        storageFree: NaN
      });
    }
    if (!storageFreePerTime[periodEnd]) {
      storageFreePerTime = storageFreePerTime.concat({
        lastModH: periodEnd,
        storageFree: NaN
      });
    }

    for (let i = 0; i < storageFreePerTime.length; i++) {
      storageFreePerTimeObj[storageFreePerTime[i].lastModH] =
        storageFreePerTime[i].storageFree;
    }
  }

  let dataStorageFreeTime = {
    datasets: [
      {
        type: "bar",
        data: Object.values(storageFreePerTimeObj),
        backgroundColor: "#ff9900"
      }
    ],
    labels: Object.keys(storageFreePerTimeObj)
  };

  return dataStorageFreeTime;
};
