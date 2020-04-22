import {demoMode, demoDate} from "../utils";

var speedDate = require("speed-date");

let uploadedPerTime = {};
let mf4ObjectsFiltered = [];
let chartData = {};

export const devicesOptionsFn = deviceList => {
  const loggerRegex = new RegExp(/([0-9A-Fa-f]){8}/);

  let devices = deviceList.filter(e => e.match(loggerRegex));

  let devicesOptions = devices.map((e, index) => {
    const label = e;
    const value = e.substr(0, 8);
    return { label, value };
  });

  devicesOptions.unshift({ label: "Clear", value: "clear" });
  devicesOptions.unshift({ label: "Select all", value: "all" });

  return devicesOptions;
};

export const selectedListFn = (event, list) => {
  const all = event.filter(e => e.value == "all").length;
  const clear = event.filter(e => e.value == "clear").length;

  let selectedList = event;
  if (all) {
    selectedList = devicesOptionsFn(list);
    selectedList = selectedList.slice(2, selectedList.length);
  }
  if (clear) {
    selectedList = [];
  }
  return selectedList;
};

export const customCheckboxStyles = {
  option: (provided, state) => ({
    ...provided,
    color: state.isSelected ? "#8e8e8e" : "#8e8e8e",
    borderColor: "white",
    borderWidth: 1,
    borderStyle: "solid",
    backgroundColor: state.isSelected ? "#edecec" : "white",
    fontWeight: "normal",
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 2,
    paddingTop: 2,
    cursor: "pointer",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    maxWidth: "300px",
    overflow: "hidden",
    fontFamily: "consolas"
  }),
  dropdownButton: (provided, state) => ({
    ...provided,
    paddingBottom: 8,
    maxWidth: "100%",
    marginTop: -33,
    height: 10,
    width: 85,
    fontSize: "80%",
    backgroundColor: "rgba(0,0,0,0) !important",
    boxShadow: 0,
    color: "#8e8e8e",
    "&:hover": {
      color: "#46a5e0"
    }
  })
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
          barPercentage: periodHours <= 1 ? 0.2 : 0.9,
          maxBarThickness: 5,
          gridLines: { display: false },
          ticks: {
            beginAtZero: true,
            maxRotation: 0
          },
          type: "time",
          time: {
            unit:
              periodHours <= 1
                ? "minute"
                : periodHours <= 48 && periodHours > 1
                ? "hour"
                : "day",
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

export const barOptionsFuncStorageUsed = periodHours => {
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
            beginAtZero: true,
            suggestedMax: 100
          }
        }
      ],
      xAxes: [
        {
          barPercentage: periodHours <= 1 ? 0.2 : 0.9,
          maxBarThickness: 5,
          gridLines: { display: false },
          ticks: {
            beginAtZero: true,
            maxRotation: 0
          },
          type: "time",
          time: {
            unit:
              periodHours <= 1
                ? "minute"
                : periodHours <= 48 && periodHours > 1
                ? "hour"
                : "day",
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
  devicesFilesCount
) => {
  // filter log files & devices based on time period
  let periodEndNew = new Date();
  let periodStartNew = new Date();

  if(demoMode){
    periodEndNew = new Date(demoDate);  // set fixed date for demo purposes
    periodStartNew = new Date(demoDate);
  }


  periodStartNew.setTime(
    periodStartNew.getTime() - periodHours * 60 * 60 * 1000
  );

  let periodStart = speedDate("YYYY-MM-DD HH", periodStartNew);
  let periodEnd = speedDate("YYYY-MM-DD HH", periodEndNew);

  let periodStartDay = speedDate("YYYY-MM-DD", periodStartNew);
  let periodEndDay = speedDate("YYYY-MM-DD", periodEndNew);

  let periodStartMin = speedDate("YYYY-MM-DD HH:mm", periodStartNew);
  let periodEndMin = speedDate("YYYY-MM-DD HH:mm", periodEndNew);

  // prepare data for bar chart of uploaded files
  mf4ObjectsFiltered =
    periodHours == 1
      ? mf4ObjectsMin
      : mf4Objects.filter(e => e.lastModified >= periodStart);

  // data for last hour
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
        acc[lastModified] =
          Math.round(parseFloat(acc[lastModified] + size) * 100) / 100;
        return acc;
      },
      {}
    );
  }

  // data for last 1 day and 7 days
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
        acc[lastModified] =
          Math.round(parseFloat(acc[lastModified] + size) * 100) / 100;
        return acc;
      },
      {}
    );
  }

  // data for last 30 days
  if (periodHours > 24 * 7) {
    uploadedPerTime = mf4ObjectsFiltered.reduce(
      (acc, { lastModified, size }) => {
        const lastModifiedD = lastModified.substr(0, 10);

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

  // prepare data for KPI boxes
  const kpiUploadedValMB = mf4ObjectsFiltered.length
    ? mf4ObjectsFiltered.reduce((a, b) => +a + +b.size, 0)
    : "";
  const kpiUploadedVal = mf4ObjectsFiltered.length
    ? Math.round((kpiUploadedValMB / 1000) * 10) / 10
    : "";
  const kpiDataPerDeviceVal =
    mf4ObjectsFiltered.length && devicesFilesCount
      ? Math.round(
          (kpiUploadedValMB / devicesFilesCount)
        )
      : "";

  const kpiFilesVal = mf4ObjectsFiltered.length
    ? mf4ObjectsFiltered.reduce((a, b) => +a + +b.count, 0)
    : "";
  const kpiAvgFileSize =
    mf4ObjectsFiltered.length && kpiFilesVal
      ? Math.round((kpiUploadedValMB / kpiFilesVal) * 10) / 10
      : "";

  if (Object.values(uploadedPerTime).length == 0) {
    uploadedPerTime = { [periodStart]: 0, [periodEnd]: 0 };
  }

  chartData = {
    kpiUploaded: kpiUploadedVal,
    kpiDataPerDevice: kpiDataPerDeviceVal,
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

  return [chartData, Object.keys(uploadedPerTime), mf4ObjectsFiltered];
};
