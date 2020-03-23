import React, { Component } from "react";
import { Bar } from "react-chartjs-2";
var speedDate = require("speed-date");
import { barOptionsFunc } from "../dashboardStatus/prepareData";
import { demoMode, demoDate } from "../utils";

export function DeviceImage(props) {
  const { deviceImage } = props;

  if (deviceImage == undefined) {
    return <div />;
  }

  return (
    <div className="col-sm-2">
      <div className="meta-image">
        {deviceImage ? (
          <img
            src={deviceImage}
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
}

export function DeviceMeta(props) {
  const { device, deviceFileContents, configFileCrc32 } = props;

  let deviceFile = deviceFileContents.filter(
    object => object != undefined && object.id == device
  )[0];

  let log_meta = deviceFile && deviceFile.log_meta;
  let space_used_mb = deviceFile && deviceFile.space_used_mb;
  let cfg_crc32 = deviceFile && deviceFile.cfg_crc32;
  let fw_ver = deviceFile && deviceFile.fw_ver;

  let crcTest =
    cfg_crc32 && configFileCrc32.length > 0 && configFileCrc32[0].crc32
      ? parseInt(cfg_crc32, 16) == parseInt(configFileCrc32[0].crc32, 16)
      : undefined;

  let cfgSync =
    crcTest == undefined ? null : !crcTest ? (
      <span className="red-text zero-bottom-margin">
        <i className="fa fa-times" />
      </span>
    ) : (
      <span className="blue-text zero-bottom-margin">
        <i className="fa fa-check" />
      </span>
    );

  return (
    <div className="col-sm-4">
      {1 ? (
        <div>
          <br />
          <table className="table table-background">
            <tbody>
              <tr>
                <td className="col-md-2">Meta</td>
                <td>{log_meta}</td>
              </tr>

              <tr>
                <td className="col-md-2" style={{ whiteSpace: "nowrap" }}>
                  SD storage used
                </td>
                <td>
                  {space_used_mb}
                  {space_used_mb ? " MB" : null}
                </td>
              </tr>
              <tr>
                <td className="col-sm-1">Firmware</td>
                <td>{fw_ver}</td>
              </tr>

              <tr>
                <td className="col-sm-1" style={{ whiteSpace: "nowrap" }}>
                  Config synced
                </td>
                <td>{cfgSync}</td>
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
    props.dataUploadTime.datasets.length &&
    props.dataUploadTime.labels.length
  ) {
    return (
      <div className="col-sm-6">
        <div className="row">
          <div className="col-sm-7">
            <p>Log file data uploaded last week (MB/hour)</p>
          </div>
          <div className="col-sm-5 chart-menu">
            <a href="" onClick={props.dashboard}>
              status dashboard
            </a>
          </div>
        </div>

        <div>
          <Bar
            data={props.dataUploadTime}
            height={130}
            options={props.barOptions}
            key={"bar-chart-logfiles"}
          />
        </div>
      </div>
    );
  } else {
    return null;
  }
}

let periodHours = 7 * 24;
let periodEndNew = demoMode ? new Date(demoDate) : new Date();
let periodStartNew = demoMode ? new Date(demoDate) : new Date();

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

  let barOptions = barOptionsFunc(7 * 24);

  return [dataUploadTime, barOptions];
};
