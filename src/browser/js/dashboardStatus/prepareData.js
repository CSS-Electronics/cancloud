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
  periodHours,
  mf4Objects,
  deviceFileObjects
) => {

  // filter log files & devices based on time period
  let periodEndNew = new Date();
  let periodStartNew = new Date();
  periodStartNew.setTime(periodStartNew.getTime() - periodHours * 60 * 60 * 1000);

  // DEVICE 
  deviceFileObjectsFiltered = deviceFileObjects.filter(
    e => e.lastModified >= periodStartNew
  );

  // bar chart
  mf4ObjectsFiltered = mf4Objects.filter(e => e.lastModified >= periodStartNew);
  mf4Objects.length = 0
  
  if (periodHours <= 1) {
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModified, size }) => {
        const lastModifiedMin = speedDate.cached('YYYY-MM-DD HH:mm',lastModified)  

        if (!acc[lastModifiedMin]) {
          acc[lastModifiedMin] = [];
        }
        if (!acc[speedDate.cached('YYYY-MM-DD HH:mm',periodEndNew)]) {
          acc[speedDate.cached('YYYY-MM-DD HH:mm',periodEndNew)] = [];
        }
        if (!acc[speedDate.cached('YYYY-MM-DD HH:mm',periodStartNew)]) {
          acc[speedDate.cached('YYYY-MM-DD HH:mm',periodStartNew)] = [];
        }
        acc[lastModifiedMin] =
          Math.round(parseFloat(acc[lastModifiedMin] + size) * 100) / 100;
        return acc;
      },
      {}
    );
  }

  if (periodHours > 1 && periodHours <= 24 * 7) {
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModified, size }) => {
        const lastModifiedH = speedDate.cached('YYYY-MM-DD HH',lastModified);

        if (!acc[lastModifiedH]) {
          acc[lastModifiedH] = [];
        }
        if (!acc[speedDate.cached('YYYY-MM-DD HH',periodEndNew)]) {
          acc[speedDate.cached('YYYY-MM-DD HH',periodEndNew)] = [];
        }
        if (!acc[speedDate.cached('YYYY-MM-DD HH',periodStartNew)]) {
          acc[speedDate.cached('YYYY-MM-DD HH',periodStartNew)] = [];
        }
        acc[lastModifiedH] =
          Math.round(parseFloat(acc[lastModifiedH] + size) * 100) / 100;
        return acc;
      },
      {}
    );
  }

  if (periodHours > 24 * 7) {
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModified, size }) => {
        const lastModifiedD = speedDate.cached('YYYY-MM-DD',lastModified)

        if (!acc[lastModifiedD]) {
          acc[lastModifiedD] = [];
        }
        if (!acc[speedDate.cached('YYYY-MM-DD',periodEndNew)]) {
          acc[speedDate.cached('YYYY-MM-DD',periodEndNew)] = [];
        }
        if (!acc[speedDate.cached('YYYY-MM-DD',periodStartNew)]) {
          acc[speedDate.cached('YYYY-MM-DD',periodStartNew)] = [];
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
  const kpiFilesVal = mf4ObjectsFiltered.length ? Object.keys(mf4ObjectsFiltered).length : ""
  
  const kpiAvgFileSize = (mf4ObjectsFiltered.length && kpiFilesVal) ? Math.round((kpiUploadedVal / kpiFilesVal) * 1000 * 10) / 10 : ""

  if (Object.values(uploadedPerTime).length == 0) {
    let default_value = speedDate.cached('YYYY-MM-DD HH',periodEndNew)
    uploadedPerTime = { default_value: 0 };
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
