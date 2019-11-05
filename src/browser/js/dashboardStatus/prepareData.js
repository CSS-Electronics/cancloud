var speedDate = require('speed-date');

let uploadedPerTime = {};
let mf4ObjectsFiltered = [];
let deviceFileObjectsFiltered = [];
let chartData = {};

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
          barPercentage: periodHours <= 1 ? 0.2 : 0.9,
          gridLines: { display: false },
          ticks: {
            beginAtZero: true
          },
          type: "time",
          time: {
            unit:
              periodHours <= 1 ? "minute" : (periodHours <= 48 && periodHours > 1) ? "hour" : "day",
              displayFormats: {
              minute: "HH:mm",
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
  periodHours,
  mf4Objects,
  mf4ObjectsMin,
  deviceFileObjects
) => {

  // filter log files & devices based on time period
  let periodEndNew = new Date();
  let periodStartNew = new Date();
  periodStartNew.setTime(periodStartNew.getTime() - periodHours * 60 * 60 * 1000);

  let periodStart = speedDate('YYYY-MM-DD HH',periodStartNew)
  let periodEnd = speedDate('YYYY-MM-DD HH',periodEndNew)

  let periodStartDay = speedDate('YYYY-MM-DD',periodStartNew)
  let periodEndDay = speedDate('YYYY-MM-DD',periodEndNew)

  let periodStartMin = speedDate('YYYY-MM-DD HH:mm',periodStartNew)
  let periodEndMin = speedDate('YYYY-MM-DD HH:mm',periodEndNew)

  // DEVICE 
  deviceFileObjectsFiltered = deviceFileObjects.filter(
    e => e.lastModified >= periodStartNew
  );

  // bar chart
  mf4ObjectsFiltered = periodHours == 1 ? mf4ObjectsMin : mf4Objects.filter(e => e.lastModified >= periodStart);

  if (periodHours <= 1) {
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModified, size }) => {
        if (!acc[lastModified]) {
          acc[lastModified] = 0;
        }
        if (!acc[periodEndMin]) {
          acc[periodEndMin] = 0;
        }
        if (!acc[periodStartMin]) {
          acc[periodStartMin] = 0;
        }
        acc[lastModified] = Math.round(parseFloat(acc[lastModified] + size) * 100)/100
        return acc;
      },
      {}
    );
  }

  if (periodHours > 1 && periodHours <= 24 * 7) {
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModified, size }) => {
        if (!acc[lastModified]) {
          acc[lastModified] = 0;
        }
        if (!acc[periodEnd]) {
          acc[periodEnd] = 0;
        }
        if (!acc[periodStart]) {
          acc[periodStart] = 0;
        }
        acc[lastModified] = Math.round(parseFloat(acc[lastModified] + size) * 100)/100
        return acc;
      },
      {}
    );
  }

  if (periodHours > 24 * 7) {
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModified, size }) => {
        const lastModifiedD = lastModified.substr(0,10)

        if (!acc[lastModifiedD]) {
          acc[lastModifiedD] = [];
        }
        if (!acc[periodEndDay]) {
          acc[periodEndDay] = [];
        }
        if (!acc[periodStartDay]) {
          acc[periodStartDay] = [];
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
  const kpiUploadedVal = mf4ObjectsFiltered.length ? 
    Math.round(
      (mf4ObjectsFiltered.reduce((a, b) => +a + +b.size, 0) / 1000) * 10
    ) / 10 : ""
  const kpiDataPerDeviceDayVal = (mf4ObjectsFiltered.length && kpiConnectedVal) ?  Math.round(
        (kpiUploadedVal / kpiConnectedVal / (periodHours / 24)) * 10000
      ) / 10
    : "";
  const kpiFilesVal = mf4ObjectsFiltered.length ? mf4ObjectsFiltered.reduce((a, b) => +a + +b.count, 0)  : ""
  const kpiAvgFileSize = (mf4ObjectsFiltered.length && kpiFilesVal) ? Math.round((kpiUploadedVal / kpiFilesVal) * 1000 * 10) / 10 : ""

  if (Object.values(uploadedPerTime).length == 0) {
    // let default_value = "2019-01-01 20" // speedDate('YYYY-MM-DD HH',periodEndNew)
    uploadedPerTime = { [periodStart]: 0, [periodEnd]: 0 };
  }

  chartData = {
    kpiUploaded: kpiUploadedVal,
    kpiDataPerDeviceDay: kpiDataPerDeviceDayVal,
    kpiFiles: kpiFilesVal,
    kpiAvgFileSize: kpiAvgFileSize,
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
    mf4ObjectsFiltered
  ];
};
