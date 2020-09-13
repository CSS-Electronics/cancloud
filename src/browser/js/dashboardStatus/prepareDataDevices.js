import Moment from "moment";
import { demoMode, demoDate } from "../utils";

let deviceFileObjectsFiltered = [];
let deviceFileContentsFiltered = [];
let chartDataDevices = {};

export const pieOptionsFunc = () => {
  return {
    maintainAspectRatio: false,
    tooltips: {
      callbacks: {
        label: function (item, data) {
          return (
            data.datasets[item.datasetIndex].label +
            " " +
            data.labels[item.index] +
            ": " +
            data.datasets[item.datasetIndex].data[item.index]
          );
        },
      },
    },
  };
};

export const horizontalBarOptionsFunc = (devices) => {
  return {
    maintainAspectRatio: false,
    legend: {
      display: false,
    },
    tooltips: {
      callbacks: {
        label: function (item, data) {
          return (
            data.datasets[item.datasetIndex].label +
            " " +
            data.labels[item.index] +
            ": " +
            data.datasets[item.datasetIndex].data[item.index]
          );
        },
      },
    },
    scales: {
      yAxes: [
        {
          maxBarThickness: 15,
          display: true,
          gridLines: { display: false },
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      xAxes: [
        {
          maxBarThickness: 5,
          gridLines: { display: false },
          ticks: {
            beginAtZero: true,
            maxRotation: 0,
            max: devices ? devices : 0,
          },
          scaleLabel: {
            display: true,
            labelString: "# devices",
            lineHeight: 0,
          },
        },
      ],
    },
  };
};

export const pieMultiOptionsFunc = () => {
  return {
    maintainAspectRatio: false,
    tooltips: {
      callbacks: {
        label: function (item, data) {
          return (
            data.datasets[item.datasetIndex].label +
            ": " +
            data.datasets[item.datasetIndex].data[item.index]
          );
        },
      },
    },
  };
};

// function for creating dynamic bins for pie charts
export const createBins = (ary, maxBinsInput, minDiff) => {
  let max = Math.max(...ary);
  max = Math.ceil(max / minDiff) * minDiff;
  let min = Math.min(...ary);
  min = Math.floor(min / minDiff) * minDiff;
  let diff = max - min;
  let bins = [];
  let binCount = 0;
  let maxBins = ary.length > 1 && diff > 5 ? maxBinsInput : 1;
  const interval = diff / maxBins;
  const numOfBuckets = maxBins;

  // setup Bins
  for (let i = 0; i < numOfBuckets; i += 1) {
    bins.push({
      binNum: binCount,
      minNum: min + i * interval,
      maxNum: min + (i + 1) * interval,
      count: 0,
    });
    binCount++;
  }

  // loop through data and add to bin's count
  for (let i = 0; i < ary.length; i++) {
    let item = ary[i];
    for (let j = 0; j < bins.length; j++) {
      let bin = bins[j];
      if (item >= bin.minNum && item < bin.maxNum + 0.000001) {
        bin.count++;
      }
    }
  }

  return bins;
};

export const prepareDataDevices = (
  periodHours,
  deviceFileObjects,
  deviceFileContents,
  configFileCrc32
) => {
  // filter log files & devices based on time period
  let periodStartNew = new Date();

  if (demoMode) {
    periodStartNew = new Date(demoDate);
  }

  periodStartNew.setTime(
    periodStartNew.getTime() - periodHours * 60 * 60 * 1000
  );

  deviceFileObjectsFiltered = deviceFileObjects.filter(
    (e) => e.lastModified >= periodStartNew
  );

  const deviceIdList = deviceFileObjectsFiltered.map(
    (device) => device.deviceId
  );

  const deviceIdListDelta = deviceFileObjectsFiltered.map((device) => {
    const deviceId = device.deviceId;
    const lastModified = Moment(device.lastModified);
    const lastModifiedDelta = demoMode
      ? Moment(demoDate).diff(lastModified, "seconds") / 60
      : Moment().diff(lastModified, "seconds") / 60;
    const lastModifiedMin = lastModified.format("YY-MM-DD HH:mm");

    return { deviceId, lastModifiedDelta, lastModifiedMin };
  });


  deviceFileContentsFiltered = deviceFileContents.filter((e) =>
    e && e.id && deviceIdList.includes(e.id) ? e : null
  );

  // device heartbeat pie chart
  let deviceStatusAry = deviceIdListDelta.map(
    (object) => object.lastModifiedDelta
  );

  let deviceStatusbins = createBins(deviceStatusAry, 5, 5);
  let deviceStatusData = deviceStatusbins.map((bin) => bin.count);

  let deviceStatusLabel = deviceStatusbins.map((bin) => {
    let min = bin.minNum;
    let max = bin.maxNum;
    let label = "";
    let unit = " m";

    if (min > 24 * 60) {
      min = Math.round((min / (60 * 24)) * 10) / 10;
      max = Math.round((max / (60 * 24)) * 10) / 10;
      unit = " d";

      if (min == max) {
        label = min.toString() + unit;
      } else {
        label = min.toString() + " - " + max.toString() + unit;
      }
    } else if (min > 60) {
      min = Math.round((min / 60) * 10) / 10;
      max = Math.round((max / 60) * 10) / 10;
      unit = " h";
      if (min == max) {
        label = min.toString() + unit;
      } else {
        label = min.toString() + " - " + max.toString() + unit;
      }
    } else if (min <= 60) {
      min = Math.round(min);
      max = Math.round(max);

      if (min == max) {
        label = min.toString() + unit;
      } else {
        label = min.toString() + " - " + max.toString() + unit;
      }
    }
    return label;
  });

  // if empty, clear variables
  if (deviceStatusData.length == 1 && deviceStatusData[0] == 0) {
    deviceStatusData = [];
    deviceStatusLabel = [];
  }

  // calculate storageUsed average for KPIs
  let storageUsedAry = deviceFileContentsFiltered.map(
    (object) =>
      object.space_used_mb &&
      object.space_used_mb.split("/")[0] &&
      Math.round(
        (object.space_used_mb.split("/")[0] /
          object.space_used_mb.split("/")[1]) *
          10000
      ) / 100
  );

  storageUsedAry = storageUsedAry.filter(
    (object) => object <= 100 && !isNaN(object) && object != undefined
  );

  const kpiUsedStorage = storageUsedAry.length
    ? (
        Math.round(
          (storageUsedAry.reduce((a, b) => a + b, 0) / storageUsedAry.length) *
            10
        ) / 10
      ).toString() + "%"
    : "";

  // storage used pie chart
  let storageUsedBins = createBins(storageUsedAry, 5, 5);

  let deviceStorageUsedData = storageUsedBins.map((bin) => bin.count);

  let deviceStorageUsedLabel = storageUsedBins.map((bin) => {
    let min =
      bin.minNum < 10
        ? Math.round(bin.minNum * 10) / 10
        : Math.round(bin.minNum);
    let max =
      bin.minNum < 10
        ? Math.round(bin.maxNum * 10) / 10
        : Math.round(bin.maxNum);
    let unit = " %";
    let label = "";

    if (!isNaN(min) && !isNaN(max) && min != max) {
      label = min.toString() + " - " + max.toString() + unit;
    } else if (!isNaN(min) && !isNaN(max) && min == max) {
      label = min.toString() + unit;
    }

    return label;
  });

  // if empty, ensure fully empty
  if (deviceStorageUsedData.length == 1 && deviceStorageUsedData[0] == 0) {
    deviceStorageUsedData = [];
    deviceStorageUsedLabel = [];
  }

  // firmware pie chart
  const deviceFWUnsorted = _.countBy(
    deviceFileContentsFiltered.map((device) => device.fw_ver)
  );

  let deviceFWSorted = {};
  let deviceFWData = [];
  let deviceFWLabel = [];
  let deviceFWColorFull = "#666666 #999999 #cfcfcf #3d85c6 #cfe2f3".split(" ");
  let deviceFWColor = [];

  Object.keys(deviceFWUnsorted)
    .sort()
    .reverse()
    .forEach(function (key) {
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

  deviceFWLabel.push("config synced");
  deviceFWLabel.push("config not synced");
  deviceFWColor.push(deviceFWColorFull[3]);
  deviceFWColor.push(deviceFWColorFull[4]);

  while (deviceFWData.length < 5) {
    deviceFWData.push(0);
    deviceFWData.push(0);
  }

  // kpi data
  const kpiConnectedVal = deviceFileObjectsFiltered
    .map((item) => item.deviceId)
    .filter((value, index, self) => self.indexOf(value) === index).length;

  // config pie chart
  let configCrc32Data = [0, 0];
  let test = false;
  let deviceCrc32Test = [];

  if (configFileCrc32 && configFileCrc32[0] && configFileCrc32[0].crc32) {
    deviceCrc32Test = deviceFileContentsFiltered.map((e) => {
      test =
        configFileCrc32.filter((c) => c.deviceId == e.id) &&
        configFileCrc32.filter((c) => c.deviceId == e.id)[0] &&
        configFileCrc32.filter((c) => c.deviceId == e.id)[0].crc32
          ? parseInt(
              configFileCrc32.filter((c) => c.deviceId == e.id)[0].crc32,
              16
            ) == parseInt(e.cfg_crc32, 16)
          : false;
      configCrc32Data[1 - test] += 1;

      const name = e.id;
      const testCrc32 = test;
      return { name, testCrc32 };
    });
  } else {
    configCrc32Data = [0, kpiConnectedVal]; // all configs set to not synced in this case
  }

  chartDataDevices = {
    kpiConnected: kpiConnectedVal,
    deviceStatus: {
      datasets: [
        {
          data: deviceStatusData,
          backgroundColor: "#0b5394 #3d85c6 #6fa8dc #9fc5e8 #cfe2f3 #f2f9ff".split(
            " "
          ),
          label: "#devices",
        },
      ],
      labels: deviceStatusLabel,
    },
    deviceConfigFW: {
      datasets: [
        {
          data: deviceFWData,
          backgroundColor: deviceFWColor,
          label: "#devices (FW)",
        },
        {
          data: configCrc32Data,
          backgroundColor: "#3d85c6 #cfe2f3".split(" "),
          label: "#devices (config)",
        },
      ],
      labels: deviceFWLabel,
    },
    deviceStorage: {
      datasets: [
        {
          data: deviceStorageUsedData,
          backgroundColor: "#ff9900 #f6b26b #f9cb9c #fce1c5 #fff2e6 #fffbf7".split(
            " "
          ),
          label: "#devices",
        },
      ],
      labels: deviceStorageUsedLabel,
    },
    kpiUsedStorage: kpiUsedStorage,
  };

  return [chartDataDevices, deviceIdListDelta, deviceCrc32Test];
};
