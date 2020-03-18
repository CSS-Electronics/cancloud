import Moment from "moment";

let deviceFileObjectsFiltered = [];
let deviceFileContentsFiltered = [];
let chartDataDevices = {};

export const pieOptionsFunc = () => {
  return {
    maintainAspectRatio: false,
    tooltips: {
      callbacks: {
        label: function(item, data) {
          return (
            data.datasets[item.datasetIndex].label +
            " " +
            data.labels[item.index] +
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
            data.datasets[item.datasetIndex].label +
            // " " + data.labels[item.index] +
            ": " +
            data.datasets[item.datasetIndex].data[item.index]
          );
        }
      }
    }
  };
};

export const prepareDataDevices = (
  periodHours,
  deviceFileObjects,
  deviceFileContents,
  configFileCrc32
) => {
 
  
  // filter log files & devices based on time period
  let periodStartNew = new Date();
  periodStartNew.setTime(periodStartNew.getTime() - periodHours * 60 * 60 * 1000);

  deviceFileObjectsFiltered = deviceFileObjects.filter(
    e => e.lastModified >= periodStartNew
  );

  const deviceIdList = deviceFileObjectsFiltered.map(device => device.deviceId);

  const deviceIdListDelta = deviceFileObjectsFiltered.map(device => {
    const deviceId = device.deviceId;
    const lastModified = Moment(device.lastModified);
    const lastModifiedDelta = Moment().diff(lastModified, "minutes");
    const lastModifiedMin = lastModified.format("YY-MM-DD HH:mm");

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

  let deviceStatusGrouped = _.groupBy(deviceIdListDelta, function(object) {
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



  // storage free pie chart
  let deviceStorageFreeLabel = ["99%+", "90%+", "70%+", "50%+", "20%+", "<20%"]

  let deviceStorageFreeGrouped = _.groupBy(deviceFileContentsFiltered, function(object) {
    const storageFree = object.space_used_mb && Math.round(object.space_used_mb.split("/")[0] / object.space_used_mb.split("/")[1] * 10000)/100 ;

    return storageFree > 99
      ? deviceStorageFreeLabel[0]
      : storageFree > 90
      ? deviceStorageFreeLabel[1]
      : storageFree > 70
      ? deviceStorageFreeLabel[2]
      : storageFree > 50
      ? deviceStorageFreeLabel[3]
      : storageFree > 20
      ? deviceStorageFreeLabel[4]
      : deviceStorageFreeLabel[5]
  });


  let deviceStorageFreeData = deviceStorageFreeLabel.map((counter, i) =>
  deviceStorageFreeGrouped[deviceStorageFreeLabel[i]]
      ? deviceStorageFreeGrouped[deviceStorageFreeLabel[i]].length
      : 0
  );

  // calculate storageFree average for KPIs
  let storageFreeAry = deviceFileContentsFiltered.map(object => object.space_used_mb && object.space_used_mb.split("/")[0] && Math.round(object.space_used_mb.split("/")[0] / object.space_used_mb.split("/")[1] * 10000)/100)
  storageFreeAry = storageFreeAry.filter(object => (object <= 100 && object != "" && object != NaN && object != undefined))
  
  const kpiFreeStorage = (Math.round((storageFreeAry.reduce((a,b) => a + b, 0) / storageFreeAry.length)*10)/10).toString() + "%"

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
    .map(item => item.deviceId)
    .filter((value, index, self) => self.indexOf(value) === index).length;
  
  const deviceIdListDeltaSort = deviceIdListDelta
    .sort(function(a, b) {
      return a.lastModifiedDelta - b.lastModifiedDelta;
    })
    .reverse();

  // config pie chart
  let configCrc32Data = [0, 0];
  let test = false;
  let deviceCrc32Test = []

  if (configFileCrc32 && configFileCrc32[0] && configFileCrc32[0].crc32) {
    
    deviceCrc32Test = deviceFileContentsFiltered.map(e => {
      test =
        configFileCrc32.filter(c => c.deviceId == e.id) &&
        configFileCrc32.filter(c => c.deviceId == e.id)[0] &&
        configFileCrc32.filter(c => c.deviceId == e.id)[0].crc32
          ? configFileCrc32.filter(c => c.deviceId == e.id)[0].crc32 ==
            e.cfg_crc32
          : false;
      configCrc32Data[1 - test] += 1;

      const name = e.id 
      const testCrc32 = test
      return {name,testCrc32}
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
          label: "#devices"
        }
      ],
      labels: deviceStatusLabel
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
    deviceStorage: {
      datasets: [
        {
          data: deviceStorageFreeData,
          backgroundColor: "#ff9900 #f6b26b #f9cb9c #fce1c5 #fff2e6 #fffbf7".split(
            " "
          ),
          label: "#devices"
        }
      ],
      labels: deviceStorageFreeLabel
    },
    kpiFreeStorage: kpiFreeStorage
  };

  return [
    chartDataDevices,
    deviceIdListDeltaSort,
    deviceCrc32Test
  ];
};
