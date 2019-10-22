import web from "../web";
import * as alertActions from "../alert/actions";
import Moment from "moment";
import _ from "lodash";
export const OBJECTS_RESULT = "dashboardStatus/OBJECTS_RESULT";
export const DEVICE_FILE_CONTENT = "dashboardStatus/DEVICE_FILE_CONTENT";
export const SET_DEVICE_FILE_OBJECT = "dashboardStatus/SET_DEVICE_FILE_OBJECT";

const currentTimestamp = Moment();

export const listAllObjects = () => {
  return function(dispatch) {
    return web
      .ListObjectsRecursive({
        bucketName: "Home",
        prefix: "",
        marker: ""
      })
      .then(data => {

        const allObjects = data.objects.map(e => {
          const name = e.name
          const deviceId = e.name.split("/")[0];
          const session = deviceId + "/" + e.name.split("/")[1];
          const lastModifiedMin = Moment(e.lastModified).format(
            "YYYY-MM-DD HH:mm"
          );
          const lastModifiedH = Moment(e.lastModified).format(
            "YYYY-MM-DD HH"
          );
          const size = e.size / 1000000;
          const lastModifiedDelta = Moment().diff(
            Moment(e.lastModified),
            "minutes"
          );
          return {
            name,
            deviceId,
            session,
            lastModifiedMin,
            lastModifiedH,
            size,
            lastModifiedDelta
          };
        });


        const deviceFileObjects = allObjects.filter(
          obj =>
            obj.name.substring(obj.name.length - 11, obj.name.length) ==
            "device.json"
        )

        const loggerConfigRegex = new RegExp(/^([0-9A-Fa-f]){8}\/config-[0-9]{2}.[0-9]{2}.json/, "g");

        console.log("TESTING", loggerConfigRegex.test("aaaaaaaa/config-00.02.json"))
        const configObjects = allObjects.filter(
          obj =>
          loggerConfigRegex.test(obj.name)
        )

        console.log(configObjects)

        const mf4Objects = allObjects
          .filter(
            obj =>
              obj.name.substring(obj.name.length - 3, obj.name.length) == "mf4"
          )

        dispatch(objectsData(mf4Objects));
        dispatch(setDeviceFileObject(deviceFileObjects));
        dispatch(fetchDeviceFileContentAll(deviceFileObjects));
      })
      .catch(err => {
        if (web.LoggedIn()) {
          dispatch(
            alertActions.set({
              type: "danger",
              message: err.message,
              autoClear: true
            })
          );
        } else {
          history.push("/login");
        }
      });
  };
};

export const objectsData = objectsData => ({
  type: OBJECTS_RESULT,
  objectsData
});

export const fetchDeviceFileContentAll = deviceFileObjects => {
  const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;
  let deviceFileContents = [];

  return function(dispatch) {
    deviceFileObjects.map((deviceFileObject, i) =>
      web
        .PresignedGet({
          bucket: deviceFileObject.deviceId,
          object: "device.json",
          expiry: expiry
        })
        .then(res => {
          fetch(res.url)
            .then(r => r.json())
            .then(data => {
              deviceFileContents.push(data);
              if (deviceFileObjects.length == deviceFileContents.length) {
                dispatch(deviceFileContent(deviceFileContents));
              }
            });
        })
        .catch(e => {
          dispatch(
            alertActions.set({
              type: "danger",
              message: e.message,
              autoClear: true
            })
          );
        })
    );
  };
};

export const deviceFileContent = deviceFileContents => ({
  type: DEVICE_FILE_CONTENT,
  deviceFileContents
});

export const setDeviceFileObject = deviceFileObjects => ({
  type: SET_DEVICE_FILE_OBJECT,
  deviceFileObjects
});