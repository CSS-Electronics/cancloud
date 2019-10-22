let uploadedPerHour = {};
let mf4ObjectsFiltered = [];
let deviceFileObjectsFiltered = [];
let deviceFileContentsFiltered = [];
let chartData = {};

export const prepareData = (  periodEnd,
  periodHours,
  periodStart,
  mf4Objects,
  deviceFileObjects,
  deviceFileContents) => {

 
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

  deviceFileContentsFiltered = deviceFileContents.filter(e =>
    deviceIdList.includes(e.id) ? e : null
  );

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
    const delta = object.lastModifiedDelta / 60;
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
  const kpiDataPerDeviceDayVal = Math.round(
    (kpiUploadedVal / kpiConnectedVal) * 1000
  );
  const kpiFilesVal = Object.keys(mf4ObjectsFiltered).length;
  const kpiAvgFileSize =
    Math.round((kpiUploadedVal / kpiFilesVal) * 1000 * 10) / 10;

  uploadedPerHour = mf4ObjectsFiltered.reduce(
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
      acc[lastModifiedH] = parseFloat(acc[lastModifiedH] + size);
      return acc;
    },
    {}
  );

  const deviceFWUnsorted = _.countBy(
    deviceFileContentsFiltered.map(device => device.fw_ver)
  );
  const deviceFWSorted = {};
  let deviceFWData = [0, 0, 0, 0, 0];
  let deviceFWLabel = [0, 0, "other FW", "config synced", "config not synced"];

  Object.keys(deviceFWUnsorted)
    .sort()
    .reverse()
    .forEach(function(key) {
      deviceFWSorted[key] = deviceFWUnsorted[key];
    });

  deviceFWData[0] = Object.values(deviceFWSorted)[0];
  deviceFWData[1] = Object.values(deviceFWSorted)[1];
  deviceFWData[2] = kpiConnectedVal - deviceFWData[0] - deviceFWData[1];

  deviceFWLabel[0] = Object.keys(deviceFWSorted)[0];
  deviceFWLabel[1] = Object.keys(deviceFWSorted)[1];

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
          backgroundColor: "#3d85c6 #6fa8dc #9fc5e8 #cfe2f3 #f2f9ff".split(" "),
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
          backgroundColor: "#666666 #999999 #cfcfcf #3d85c6 #cfe2f3".split(" "),
          label: "#devices"
        },
        {
          data: [13, 2],
          backgroundColor: "#3d85c6 #cfe2f3".split(" "),
          label: "#devices"
        }
      ],
      labels: deviceFWLabel
    },
    dataUploadTime: {
      datasets: [
        {
          data: Object.values(uploadedPerHour),
          backgroundColor: "#3d85c6"
        }
      ],
      labels: Object.keys(uploadedPerHour)
    }
  };

  return chartData;

  }
