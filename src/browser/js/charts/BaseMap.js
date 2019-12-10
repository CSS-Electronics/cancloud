import React from "react";
import _ from "lodash";
import hexToRgba from "hex-to-rgba";
import {
  Map,
  TileLayer,
  Popup,
  Polyline,
  CircleMarker
} from "react-leaflet";

const BaseMap = props => {
  const { datasets, chColors, chHeight } = props;

  let chColorsTrans = chColors.map(color => hexToRgba(color, "0.1"));

  if(datasets.length == 0){
    return(<div><p className="widget-no-data">The widget configuration did not yield any data</p></div>);
  }

  // set the header labels for use in indexing object properties
  const device_serialno = datasets[0].label;
  const time_stamp = datasets[1].label;
  const longitude = datasets[2].label; // could be extended for multiple parameters
  const latitude = datasets[3].label;
  const datasetsRestructured = [];
  let bounds = [];

  // restructure the dataset to be suitable
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

  for (let i = 0; i < deviceIds.length; i++) {
    let datasetsDeviceFiltered = datasetsRestructured.filter(
      e => e[device_serialno] == deviceIds[i] && e[longitude] != ""
    );

    datasetsDevice = datasetsDeviceFiltered.map(e => {
      const x = e[longitude];
      const y = e[latitude];
      return [x, y];
    });

    datasetsAllDevices[i] = {
      label: deviceIds[i],
      data: datasetsDevice,
      borderColor: chColors[i],
      backgroundColor: chColorsTrans[i],
      hoverBorderColor: chColorsTrans,
      position: {
        lat: datasetsDevice[datasetsDevice.length - 1][0],
        lng: datasetsDevice[datasetsDevice.length - 1][1]
      }
    };

    bounds.push(datasetsDevice);
  }

  return (
    <div>
      {datasets ? (
        <div>
          <Map
            bounds={bounds}
            zoomControl={false}
            style={{
              height: chHeight,
              zIndex: 1
            }}
          >
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {datasetsAllDevices.map((devices, i) => (
              <div key={datasetsAllDevices[i].label}>
                <Polyline
                  key={datasetsAllDevices[i].label}
                  positions={datasetsAllDevices[i].data}
                  color={datasetsAllDevices[i].borderColor}
                />
                <CircleMarker
                  center={datasetsAllDevices[i].position}
                  color={datasetsAllDevices[i].borderColor}
                  radius="7"
                >
                  <Popup>
                    <span>{datasetsAllDevices[i].label}</span>
                  </Popup>
                </CircleMarker>
              </div>
            ))}
          </Map>
        </div>
      ) : null}
    </div>
  );
};

export default BaseMap;
