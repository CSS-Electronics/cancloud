import Moment from "moment";

let uploadedPerTime = {};
let mf4ObjectsFiltered = [];
let deviceFileObjectsFiltered = [];
let deviceFileContentsFiltered = [];
let chartData = {};


export const pieOptionsFunc = () => {
  return {
    maintainAspectRatio: false,
    tooltips: {
      callbacks: {
        label: function(item, data) {
          return (
            data.datasets[item.datasetIndex].label +
            " " + data.labels[item.index] +
            ": " +
            data.datasets[item.datasetIndex].data[item.index]
          );
        }
      }
    }
  };
};


export const pieMultiOptionsFunc = () => {
  return {
    maintainAspectRatio: false,
    tooltips: {
      callbacks: {
        label: function(item, data) {
          return (
            data.datasets[item.datasetIndex].label 
            +
            // " " + data.labels[item.index] +
            ": " +
            data.datasets[item.datasetIndex].data[item.index]
          );
        }
      }
    }
  };
};

export const barOptionsFunc = periodHours => {
  return {
    maintainAspectRatio: false,
    legend: {
      display: false
    },
    scales: {
      yAxes: [
        {
          display: true,
          ticks: {
            beginAtZero: true
          }
        }
      ],
      xAxes: [
        {
          gridLines: { display: false },
          ticks: {
            beginAtZero: true
          },
          type: "time",
          time: {
            unit:
              periodHours <= 1 ? "minute" : periodHours <= 48 ? "hour" : "day",
            displayFormats: {
              minute: "MM/DD HH:mm",
              hour: "MM/DD HH:mm",
              day: "MM/DD"
            }
          }
        }
      ]
    }
  };
};

export const prepareData = (
  periodEnd,
  periodHours,
  periodStart,
  mf4Objects,
  deviceFileObjects,
  deviceFileContents,
  configFileCrc32,
  now
) => {

  // filter log files & devices based on time period
  mf4ObjectsFiltered = mf4Objects.filter(
    e =>
      Moment(e.lastModified).format("YYYY-MM-DD HH:mm") <= periodEnd.format("YYYY-MM-DD HH:mm") &&
      Moment(e.lastModified).format("YYYY-MM-DD HH:mm") >= periodStart.format("YYYY-MM-DD HH:mm")
  );

  deviceFileObjectsFiltered = deviceFileObjects.filter(
    e =>
    Moment(e.lastModified).format("YYYY-MM-DD HH:mm") <= periodEnd.format("YYYY-MM-DD HH:mm") &&
    Moment(e.lastModified).format("YYYY-MM-DD HH:mm") >= periodStart.format("YYYY-MM-DD HH:mm")
  );

  const deviceIdList = deviceFileObjectsFiltered.map(device => device.deviceId);

  const deviceIdListDelta = deviceFileObjectsFiltered.map(device => {
    const deviceId = device.deviceId;
    const lastModified = Moment(device.lastModified)
    const lastModifiedDelta = now.diff(lastModified, "minutes");
    const lastModifiedMin = lastModified.format("YYYY-MM-DD HH:mm");

    return { deviceId, lastModifiedDelta, lastModifiedMin };
  });


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

  let deviceStatusGrouped = _.groupBy(deviceIdListDelta, function(
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
  deviceFWLabel.push("config not synced");
  deviceFWColor.push(deviceFWColorFull[3]);
  deviceFWColor.push(deviceFWColorFull[4]);

  // bar chart
  if (periodHours <= 1) {
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModified, size }) => {
        const lastModifiedMin = Moment(lastModified).format("YYYY-MM-DD HH:mm")

        if (!acc[lastModifiedMin]) {
          acc[lastModifiedMin] = [];
        }
        if (!acc[periodEnd.format("YYYY-MM-DD HH:mm")]) {
          acc[periodEnd.format("YYYY-MM-DD HH:mm")] = [];
        }
        if (!acc[periodStart.format("YYYY-MM-DD HH:mm")]) {
          acc[periodStart.format("YYYY-MM-DD HH:mm")] = [];
        }
        acc[lastModifiedMin] =
          Math.round(parseFloat(acc[lastModifiedMin] + size) * 100) / 100;
        return acc;
      },
      {}
    );
  }


  if (periodHours > 1 && periodHours <= 24*7) {
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModified, size }) => {
        const lastModifiedH = Moment(lastModified).format("YYYY-MM-DD HH")

        if (!acc[lastModifiedH]) {
          acc[lastModifiedH] = [];
        }
        if (!acc[periodEnd.format("YYYY-MM-DD HH")]) {
          acc[periodEnd.format("YYYY-MM-DD HH")] = [];
        }
        if (!acc[periodStart.format("YYYY-MM-DD HH")]) {
          acc[periodStart.format("YYYY-MM-DD HH")] = [];
        }
        acc[lastModifiedH] =
          Math.round(parseFloat(acc[lastModifiedH] + size) * 100) / 100;
        return acc;
      },
      {}
    );
  }

  if (periodHours > 24*7) {
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModified, size }) => {
        const lastModifiedD = Moment(lastModified).format("YYYY-MM-DD")

        if (!acc[lastModifiedD]) {
          acc[lastModifiedD] = [];
        }
        if (!acc[periodEnd.format("YYYY-MM-DD")]) {
          acc[periodEnd.format("YYYY-MM-DD")] = [];
        }
        if (!acc[periodStart.format("YYYY-MM-DD")]) {
          acc[periodStart.format("YYYY-MM-DD")] = [];
        }
        acc[lastModifiedD] =
          Math.round(parseFloat(acc[lastModifiedD] + size) * 100) / 100;
        return acc;
      },
      {}
    );
  }

  // kpi data
  const kpiConnectedVal = deviceFileObjectsFiltered
    .map(item => item.deviceId)
    .filter((value, index, self) => self.indexOf(value) === index).length;
  const kpiFreeStorage = "WIP";
  const kpiUploadedVal =
    Math.round(
      (mf4ObjectsFiltered.reduce((a, b) => +a + +b.size, 0) / 1000) * 10
    ) / 10;
  const kpiDataPerDeviceDayVal = kpiConnectedVal
    ? Math.round(
        (kpiUploadedVal / kpiConnectedVal / (periodHours / 24)) * 10000
      ) / 10
    : 0;
  const kpiFilesVal = Object.keys(mf4ObjectsFiltered).length;
  const kpiAvgFileSize = kpiFilesVal
    ? Math.round((kpiUploadedVal / kpiFilesVal) * 1000 * 10) / 10
    : 0;

  if (Object.values(uploadedPerTime).length == 0) {
    let default_value = periodEnd.format("YYYY-MM-DD HH");
    uploadedPerTime = { default_value: 0 };
  }

  const deviceIdListDeltaSort = deviceIdListDelta
    .sort(function(a, b) {
      return a.lastModifiedDelta - b.lastModifiedDelta;
    })
    .reverse();

    // config pie chart
    let configCrc32Data = [0, 0];
    let test = false;
  
    if (configFileCrc32 && configFileCrc32[0] && configFileCrc32[0].crc32) {
  
      deviceFileContentsFiltered.map(e => {
        test =
          configFileCrc32.filter(c => c.deviceId == e.id) &&
          configFileCrc32.filter(c => c.deviceId == e.id)[0] &&
          configFileCrc32.filter(c => c.deviceId == e.id)[0].crc32
            ? configFileCrc32.filter(c => c.deviceId == e.id)[0].crc32 ==
              e.cfg_crc32
            : false;
        configCrc32Data[1 - test] += 1;
      });
    }else{
      configCrc32Data = [0, kpiConnectedVal]; // all configs set to not synced in this case
    }
  

  chartData = {
    kpiConnected: kpiConnectedVal,
    kpiUploaded: kpiUploadedVal,
    kpiDataPerDeviceDay: kpiDataPerDeviceDayVal,
    kpiFiles: kpiFilesVal,
    kpiAvgFileSize: kpiAvgFileSize,
    kpiFreeStorage: kpiFreeStorage,
    deviceStatus: {
      datasets: [
        {
          data: deviceStatusData,
          backgroundColor: "#0b5394 #3d85c6 #6fa8dc #9fc5e8 #cfe2f3 #f2f9ff".split(
            " "
          ),
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
          label: "#devices (FW)"
        },
        {
          data: configCrc32Data,
          backgroundColor: "#3d85c6 #cfe2f3".split(" "),
          label: "#devices (config)"
        }
      ],
      labels: deviceFWLabel
    },
    dataUploadTime: {
      datasets: [
        {
          type: "bar",
          data: Object.values(uploadedPerTime),
          backgroundColor: "#3d85c6"
        }
      ],
      labels: Object.keys(uploadedPerTime)
    }
  };

  return [
    chartData,
    Object.keys(uploadedPerTime),
    deviceIdListDeltaSort,
    mf4ObjectsFiltered
  ];
};
