import React from "react";

let uploadedPerTime = {};
let mf4ObjectsFiltered = [];
let deviceFileObjectsFiltered = [];
let deviceFileContentsFiltered = [];
let chartData = {};

function sortObject(obj) {
  var arr = [];
  for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        console.log(prop)
        console.log(obj[prop])
          arr.push({
              'key': prop,
              'value': obj[prop]
          });
      }
  }
  arr.sort(function(a, b) { return a.value - b.value; });
  return arr; 
}

export const pieOptionsFunc = () => {
  return(
  {maintainAspectRatio: false,
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
})}


export const barOptionsFunc = (periodHours) => {
  return({
  maintainAspectRatio: false,
  legend: {
    display: false
  },
  scales: {
    yAxes:[
      {display: true,
        ticks: {
            beginAtZero: true
        }}
    ],
    xAxes: [
      {
        gridLines: { display: false },
        ticks: {
          beginAtZero: true
        },
        type: "time",
        time: {
          unit: periodHours <= 1 ? "minute" : periodHours <= 48 ? "hour" : "day"
          ,
          displayFormats: {
            minute: "MM/DD HH:mm",
            hour: "MM/DD HH:mm",
            day: "MM/DD"
          }
        }
      }
    ]
  }
})}


export const prepareData = (
  periodEnd,
  periodHours,
  periodStart,
  mf4Objects,
  deviceFileObjects,
  deviceFileContents,
  configFileCrc32
) => {

  // filter log files & devices based on time period
  mf4ObjectsFiltered = mf4Objects.filter(
    e =>
      e.lastModifiedMin <= periodEnd.format("YYYY-MM-DD HH:mm") &&
      e.lastModifiedMin >= periodStart.format("YYYY-MM-DD HH:mm")
  );

  deviceFileObjectsFiltered = deviceFileObjects.filter(
    e =>
      e.lastModifiedMin <= periodEnd.format("YYYY-MM-DD HH:mm") &&
      e.lastModifiedMin >= periodStart.format("YYYY-MM-DD HH:mm")
  );

  const deviceIdList = deviceFileObjectsFiltered.map(device => device.deviceId);
  const deviceIdListDelta = deviceFileObjectsFiltered.map(device => {
    
    const deviceId = device.deviceId
    const lastModifiedDelta = device.lastModifiedDelta
    const lastModifiedMin = device.lastModifiedMin
    return{deviceId, lastModifiedDelta, lastModifiedMin}});


  deviceFileContentsFiltered = deviceFileContents.filter(e =>
    deviceIdList.includes(e.id) ? e : null
  );

  // device status pie chart
  let deviceStatusLabel = [
    "<5 min",
    "<1 hours",
    "<24 hours",
    "<7 days",
    ">7 days"
  ];

  let deviceStatusGrouped = _.groupBy(deviceFileObjectsFiltered, function(
    object
  ) {
    const delta = object.lastModifiedDelta;
    return delta < 5
      ? deviceStatusLabel[0]
      : delta < 60
      ? deviceStatusLabel[1]
      : delta < 24 * 60
      ? deviceStatusLabel[2]
      : delta < 7 * 24 * 60
      ? deviceStatusLabel[3]
      : deviceStatusLabel[4];
  });

  let deviceStatusData = deviceStatusLabel.map((counter, i) =>
    deviceStatusGrouped[deviceStatusLabel[i]]
      ? deviceStatusGrouped[deviceStatusLabel[i]].length
      : 0
  );

  // kpi data
  const kpiConnectedVal = deviceFileObjectsFiltered
    .map(item => item.deviceId)
    .filter((value, index, self) => self.indexOf(value) === index).length;
  const kpiSessionsVal = mf4ObjectsFiltered
    .map(item => item.session)
    .filter((value, index, self) => self.indexOf(value) === index).length;
  const kpiUploadedVal =
    Math.round(
      (mf4ObjectsFiltered.reduce((a, b) => +a + +b.size, 0) / 1000) * 10
    ) / 10;
  const kpiDataPerDeviceDayVal = kpiConnectedVal ? Math.round(
    ((kpiUploadedVal / kpiConnectedVal) / (periodHours / 24)) * 10000
  )/10 : 0;
  const kpiFilesVal = Object.keys(mf4ObjectsFiltered).length;
  const kpiAvgFileSize = kpiFilesVal ? 
    Math.round((kpiUploadedVal / kpiFilesVal) * 1000 * 10) / 10 : 0;

  // firmware pie chart
  const deviceFWUnsorted = _.countBy(
    deviceFileContentsFiltered.map(device => device.fw_ver)
  );

  let deviceFWSorted = {};
  let deviceFWData = [];
  let deviceFWLabel = [];
  let deviceFWColorFull = "#666666 #999999 #cfcfcf #3d85c6 #cfe2f3".split(" ");
  let deviceFWColor = [];

  Object.keys(deviceFWUnsorted)
    .sort()
    .reverse()
    .forEach(function(key) {
      deviceFWSorted[key] = deviceFWUnsorted[key];
    });

  let iColorCnt = 0;
  for (var key in deviceFWSorted) {
    if (deviceFWSorted.hasOwnProperty(key)) {
      if (deviceFWData.length < 4) {
        deviceFWData.push(deviceFWSorted[key]);
        deviceFWLabel.push(key);
        deviceFWColor.push(deviceFWColorFull[iColorCnt]);
      } else {
        deviceFWData[2] += deviceFWSorted[key];
        deviceFWLabel[2] = "other FW";
        deviceFWColor[2] = deviceFWColorFull[2];
      }
      iColorCnt += 1;
    }
  }

  while (deviceFWData.length < 5) {
    deviceFWData.push(0);
    deviceFWData.push(0);
  }

  deviceFWLabel.push("config synced");
  deviceFWColor.push(deviceFWColorFull[3]);
  deviceFWLabel.push("config not synced");
  deviceFWColor.push(deviceFWColorFull[4]);

 

  // config pie chart
  let configCrc32Data = [0, 0];
  let test = false;

  deviceFileContentsFiltered.map(e => {
    test =
      configFileCrc32.filter(c => c.deviceId == e.id)[0].crc32 == e.cfg_crc32;
    configCrc32Data[1 - test] += 1;
  });

  // uploaded per hour bar chart
  uploadedPerTime = mf4ObjectsFiltered.reduce(
    (acc, { lastModifiedH, size }) => {
      if (!acc[lastModifiedH]) {
        acc[lastModifiedH] = [];
      }
      if (!acc[periodEnd.format("YYYY-MM-DD HH")]) {
        acc[periodEnd.format("YYYY-MM-DD HH")] = [];
      }
      if (!acc[periodStart.format("YYYY-MM-DD HH")]) {
        acc[periodStart.format("YYYY-MM-DD HH")] = [];
      }
      acc[lastModifiedH] = Math.round(parseFloat(acc[lastModifiedH] + size)*100)/100;
      return acc;
    },
    {}
  );

  if(periodHours <= 1){
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModifiedMin, size }) => {
        if (!acc[lastModifiedMin]) {
          acc[lastModifiedMin] = [];
        }
        if (!acc[periodEnd.format("YYYY-MM-DD HH:mm")]) {
          acc[periodEnd.format("YYYY-MM-DD HH:mm")] = [];
        }
        if (!acc[periodStart.format("YYYY-MM-DD HH:mm")]) {
          acc[periodStart.format("YYYY-MM-DD HH:mm")] = [];
        }
        acc[lastModifiedMin] = Math.round(parseFloat(acc[lastModifiedMin] + size)*100)/100;
        return acc;
      },
      {}
    );
  }

  if(Object.values(uploadedPerTime).length == 0){
    let default_value = periodEnd.format("YYYY-MM-DD HH")
    uploadedPerTime = {default_value: 0}
  }

  // device table
 /// ****** 
 

  const deviceIdListDeltaSort = deviceIdListDelta.sort(function (a, b) {
    return a.lastModifiedDelta - b.lastModifiedDelta;
  }).reverse();


  chartData = {
    kpiConnected: kpiConnectedVal,
    kpiUploaded: kpiUploadedVal,
    kpiDataPerDeviceDay: kpiDataPerDeviceDayVal,
    kpiFiles: kpiFilesVal,
    kpiAvgFileSize: kpiAvgFileSize,
    kpiSessions: kpiSessionsVal,
    deviceStatus: {
      datasets: [
        {
          data: deviceStatusData,
          backgroundColor: "#0b5394 #3d85c6 #6fa8dc #9fc5e8 #cfe2f3 #f2f9ff".split(" "),
          label: "#devices"
        }
      ],
      labels: deviceStatusLabel
    },
    deviceStorage: {
      datasets: [
        {
          data: [8, 2, 2, 1, 1, 1],
          backgroundColor: "#ff9900 #f6b26b #f9cb9c #fce1c5 #ffebd7 #fff7ee".split(
            " "
          ),
          label: "#devices"
        }
      ],
      labels: ["90%+", "70%+", "50%+", "30%+", "10%+", "<10%"]
    },
    deviceConfigFW: {
      datasets: [
        {
          data: deviceFWData,
          backgroundColor: deviceFWColor,
          label: "#devices (Firmware)"
        }
        ,
        {
          data: configCrc32Data,
          backgroundColor: "#3d85c6 #cfe2f3".split(" "),
          label: "#devices (Configuration File)"
        }
      ],
      labels: deviceFWLabel
    },
    dataUploadTime: {
      datasets: [
        {
          type:'bar',
          data: Object.values(uploadedPerTime),  
          backgroundColor: "#3d85c6"
        }
      ],
      labels: Object.keys(uploadedPerTime)
    }
  };

  return [chartData,Object.keys(uploadedPerTime), deviceIdListDeltaSort, mf4ObjectsFiltered];
};
