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
        <p>
          Log file data uploaded last week (MB/hour){" "}|{" "} 
          <a href="" onClick={props.dashboard}>
            status dashboard
          </a>
        </p>

        <div>
          <Bar
            data={props.dataUploadTime}
            height={130}
            options={props.barOptions}
          />
        </div>
      </div>
    );
  } else {
    return null;
  }
}


export const prepareDeviceData = (mf4Objects) => {

  // filter log files & devices based on time period
  let periodHours = 7 * 24;
  let periodEndNew = new Date();
  let periodStartNew = new Date();
  periodStartNew.setTime(
    periodStartNew.getTime() - periodHours * 60 * 60 * 1000
  );

  let periodStart = speedDate("YYYY-MM-DD HH", periodStartNew);
  let periodEnd = speedDate("YYYY-MM-DD HH", periodEndNew);

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


  return [dataUploadTime, barOptions]

}