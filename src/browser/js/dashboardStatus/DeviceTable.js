import React from "react";

const DeviceTable = props => {
  const {
    deviceIdListDeltaSort,
    deviceFileContents,
    serverConfig,
    mf4ObjectsFiltered,
    deviceCrc32Test
  } = props;

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

  let maxUploaded = Math.max.apply(Math, Object.values(uploadedPerDevice));

  if (deviceIdListDeltaSort.length == 0) {
    return (
      <div>
        <p className="widget-no-data">No devices to list</p>
      </div>
    );
  }

  let maxDelta = Math.max.apply(
    Math,
    deviceIdListDeltaSort.map(function(o) {
      return o.lastModifiedDelta;
    })
  );
  let serverConfigTest =
    serverConfig && serverConfig.devicemeta && serverConfig.devicemeta.devices;

  const tableData = deviceIdListDeltaSort.map(e => {
    const deviceFile = deviceFileContents.filter(
      devFile => devFile.id == e.deviceId
    )[0];

    const name = serverConfigTest
      ? serverConfig.devicemeta.devices.filter(o => o.serialno == e.deviceId)[0]
        ? serverConfig.devicemeta.devices.filter(
            o => o.serialno == e.deviceId
          )[0].name
        : ""
      : "";

    const time_since_heartbeat_min = maxDelta
      ? Math.round((e.lastModifiedDelta / maxDelta) * 100) / 100
      : 0;
    const id = e.deviceId;
    const meta = deviceFile && deviceFile.log_meta ? deviceFile.log_meta : "";
    const fw_ver = deviceFile && deviceFile.fw_ver ? deviceFile.fw_ver : "";
    const last_heartbeat = e.lastModifiedMin;
    const uploadedMb =
      maxUploaded && uploadedPerDevice[e.deviceId]
        ? ((uploadedPerDevice[e.deviceId] / maxUploaded) * 100) / 100
        : NaN;
    const config_sync =
      deviceCrc32Test[0] &&
      deviceCrc32Test.filter(obj => obj.name == e.deviceId)[0] &&
      deviceCrc32Test.filter(obj => obj.name == e.deviceId)[0].testCrc32
        ? deviceCrc32Test.filter(obj => obj.name == e.deviceId)[0].testCrc32
        : false;

    return {
      id,
      name,
      meta,
      last_heartbeat,
      time_since_heartbeat_min,
      uploadedMb,
      fw_ver,
      config_sync
    };
  });

  const stringHeader = {
    last_heartbeat: "Last heartbeat",
    time_since_heartbeat_min: "Min since heartbeat",
    id: "Device ID",
    meta: "Config meta",
    name: "Server meta",
    fw_ver: "FW",
    uploadedMb: "MB uploaded",
    config_sync: "Config synced"
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
                        width: v ? v * 100 : 0,
                        height: "100%",
                        backgroundColor: "#3d85c6",
                        color: v > 0.2 ? "white" : "#8e8e8e"
                      }}
                    >
                      &nbsp;{Math.round(v * maxDelta)}
                    </span>
                  </li>
                </ul>
              ) : index == 5 ? (
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
                      &nbsp;{Math.round(v * maxUploaded)}
                    </span>
                  </li>
                </ul>
              ) : index == 7 ? (
                <div>
                  {" "}
                  {v == true ? (
                    <p className="blue-text"><i className="fa fa-check" /></p>
                  ) : (
                    <p className="red-text"><i className="fa fa-times" /></p>
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
    <div className="widget-table" style={{ fontSize: "80%", height: 160 }}>
      <table className="table">
        <thead>{tableHeader}</thead>
        <tbody className="widget-table-table">{tableValues}</tbody>
      </table>
    </div>
  );
};

export default DeviceTable;
