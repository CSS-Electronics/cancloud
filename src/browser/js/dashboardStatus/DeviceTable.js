import React from "react";
import Moment from "moment";

const DeviceTable = props => {
  const {
    deviceIdListDeltaSort,
    deviceFileContents,
    serverConfig,
    mf4ObjectsFiltered,
    deviceCrc32Test,
    height,
    deviceLastMf4MetaData
  } = props;
  
  // return empty div if no devices to list
  if (deviceIdListDeltaSort.length == 0) {
    return (
      <div>
        <p className="widget-no-data">No devices to list</p>
      </div>
    );
  }
  
  // aggregate uploaded data size by device
  const uploadedPerDevice = mf4ObjectsFiltered.reduce(
    (acc, { deviceId, size }) => {
      if (!acc[deviceId]) {
        acc[deviceId] = [];
      }
      acc[deviceId] = Math.round(parseFloat(acc[deviceId] + size) * 100) / 100;
      return acc;
    },
    {}
  );

  // identify the max size & delta (time since heartbeat) for use in the visual "bar charts" in table
  let maxUploaded = Math.max.apply(Math, Object.values(uploadedPerDevice));

  let maxDelta = Math.max.apply(
    Math,
    deviceIdListDeltaSort.map(function(o) {
      return o.lastModifiedDelta;
    })
  );

  // check if a server config exists and if it includes device meta data
  let serverConfigTest =
    serverConfig && serverConfig.devicemeta && serverConfig.devicemeta.devices;

  // construct object containing all relevant table data based on sorted device ID list
  const tableData = deviceIdListDeltaSort.map(e => {

    // extract the device.json content related to the device
    const deviceFile = deviceFileContents.filter(
      devFile => devFile.id == e.deviceId
    )[0];

    // extract object with meta data on last log file uploaded for the device
    const lastMf4Meta = deviceLastMf4MetaData.filter(
     meta => meta.name.split("/")[0] == e.deviceId
    )[0];

    // if a server config exists, extract the meta data name
    const name = serverConfigTest
      ? serverConfig.devicemeta.devices.filter(o => o.serialno == e.deviceId)[0]
        ? serverConfig.devicemeta.devices.filter(
            o => o.serialno == e.deviceId
          )[0].name
        : ""
      : "";

    // calculate the delta time since last heartbeat
    const time_since_heartbeat_min = maxDelta
      ? Math.round((e.lastModifiedDelta) * 100) / 100
      : 0;

    // extract the device ID and various properties from the device.json
    const id = e.deviceId;
    const meta = deviceFile && deviceFile.log_meta 
    const fwVer = deviceFile && deviceFile.fw_ver  
    const lastHeartbeat = e.lastModifiedMin;
    const uploadedMb =
      maxUploaded && uploadedPerDevice[e.deviceId]
        ? ((uploadedPerDevice[e.deviceId] / maxUploaded) * 100) / 100
        : NaN;
    const configSync =
      deviceCrc32Test[0] &&
      deviceCrc32Test.filter(obj => obj.name == e.deviceId)[0] &&
      deviceCrc32Test.filter(obj => obj.name == e.deviceId)[0].testCrc32 
    let storageFree = deviceFile && Math.round(deviceFile.space_used_mb.split("/")[0] / deviceFile.space_used_mb.split("/")[1] * 10000)/100 
    storageFree = storageFree <= 100 ? storageFree : ""
    let lastLogUpload = lastMf4Meta && lastMf4Meta.lastModified
    lastLogUpload = lastLogUpload ? Moment(lastLogUpload).format("YY-MM-DD HH:mm") : ""

    return {
      id,
      name,
      meta,
      lastHeartbeat,
      time_since_heartbeat_min,
      fwVer,
      configSync,
      storageFree,
      lastLogUpload,
      uploadedMb
    };
  });


  const stringHeader = {
    lastHeartbeat: "Last heartbeat",
    time_since_heartbeat_min: "Time since heartbeat",
    id: "Device ID",
    meta: "Config meta",
    name: "Server meta",
    fwVer: "Firmware",
    uploadedMb: "MB uploaded",
    storageFree: "Free SD storage",
    configSync: "Config synced",
    lastLogUpload: "Last log upload"
  };

  const tableHeader = (
    <tr>
      {Object.keys(tableData[0]).map((e, index) => {
        return (
          <th className="widget-table-head" key={"tableHeader " + index}>
            <b>{stringHeader[e]}</b>
          </th>
        );
      })}
    </tr>
  );

  const tableValues = tableData.map((e, indexOuter) => {
    return (
      <tr key={"tableRow " + indexOuter}>
        {Object.values(e).map((v, index) => {
          return (
            <td key={"tableCell " + index}>
              {index == 4 ? (
                <ul className="chart">
                  <li>
                    <span
                      style={{
                        width: v ? v/maxDelta * 100 : 0,
                        height: "100%",
                        backgroundColor: "#3d85c6",
                        color: (v/maxDelta) > 0.2 ? "white" : "#8e8e8e"
                      }}
                    >
                      &nbsp;{Math.round(v)}&nbsp;min
                    </span>
                  </li>
                </ul>
              ) : index == 9 ? (
                <ul className="chart">
                  <li>
                    <span
                      style={{
                        width: v ? v * 100 : 0,
                        height: "100%",
                        backgroundColor: "#3d85c6",
                        color: v > 0.2 ? "white" : "#8e8e8e"
                      }}
                    >
                     {v ? <div>&nbsp;{Math.round(v * maxUploaded)}&nbsp;MB</div> : <div>&nbsp;{Math.round(v * maxUploaded)}</div>}
                    </span>
                  </li>
                </ul>
              )  : index == 7 ? (
                <ul className="chart">
                  <li>
                    <span
                      style={{
                        width: v ? v : 0,
                        height: "100",
                        backgroundColor: "#FF9900",
                        color: v > 10 ? "white" : "#8e8e8e"
                      }}
                    >
                      {v ? <div>&nbsp;{v}&nbsp;%</div> : ""}
                    </span>
                  </li>
                </ul>
              ) : index == 6 ? (
                <div>
                  {" "}
                  {v == true ? (
                    <p className="blue-text zero-bottom-margin"><i className="fa fa-check" /></p>
                  ) : (
                    <p className="red-text zero-bottom-margin"><i className="fa fa-times" /></p>
                  )}
                </div>
              ) : (
                v
              )}
            </td>
          );
        })}
      </tr>
    );
  });

  return (
    <div className="widget-table" style={{ fontSize: "80%", height: height }}>
      <table className="table">
        <thead>{tableHeader}</thead>
        <tbody>{tableValues}</tbody>
      </table>
    </div>
  );
};

export default DeviceTable;
