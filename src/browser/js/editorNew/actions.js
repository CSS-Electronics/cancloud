import * as actionsEditor from "./editorBase/actions"
import * as actionsBrowser from "../browser/actions"
import web from "../web";
import history from "../history";
import Moment from "moment"

import {
  isValidSchema,
  isValidConfig,
  pathSlice,
} from "../utils";

const regexDeviceFile = new RegExp(/^device\.json/, "g");


export const fetchFilesS3 = (prefix) => {
  return function(dispatch) {
    // dispatch(resetFiles());

    // list & load devive specific Rule Schemas and Configuration Files
    return web
      .ListObjects({
        bucketName: prefix,
        prefix: "",
        marker: ""
      })
      .then(data => {
        let allObjects = [];
        allObjects = data.objects.map(object => object.name.split("/")[0]);

        // Rule Schemas
        let schemaFiles = allObjects
          .filter(str => isValidSchema(str))
          .sort()
          .reverse();

        dispatch(actionsEditor.setSchemaFile(schemaFiles));
        dispatch(fetchFileContentS3(schemaFiles[0],"schema"));

        // Configuration Files
        let configFiles = allObjects
          .filter(str => isValidConfig(str))
          .sort()
          .reverse();

        dispatch(actionsEditor.setConfigFile(configFiles));
        dispatch(fetchFileContentS3(configFiles[0], "config"));

        // Device File
        // const deviceFileName = allObjects.filter(str =>
        //   str.match(regexDeviceFile)
        // );

        // const deviceFileObject = data.objects.filter(
        //   p => p.name === "device.json"
        // )[0];
        // const deviceFileLastModified = deviceFileObject
        //   ? Moment(deviceFileObject.lastModified).format(
        //       "MMMM Do YYYY, h:mm:ss a"
        //     )
        //   : "";

        // dispatch(actionsBrowser.fetchDeviceFileContent(deviceFileName[0], prefix));
        // dispatch(actionsBrowser.setDeviceFileLastModified(deviceFileLastModified));

      })
      .catch(err => {
        if (web.LoggedIn()) {
          window.alert(err.message);
        } else {
          history.push("/login");
        }
      });
  };
};


// fetch file contents from S3 for Rule Schema or Configuration Files
// This should only be triggered by non UIschema dropdowns
export const fetchFileContentS3 = (fileName, type) => {
  console.log("we get here (S3)", fileName)

  return function(dispatch) {

    if(fileName == "None"){
      switch(type){
        case "schema":
          dispatch(actionsEditor.resetLocalSchemaList());
          dispatch(actionsEditor.setSchemaContent(null));
          break;
        case "config":
          dispatch(actionsEditor.resetLocalConfigList());
          dispatch(actionsEditor.setConfigContent(null));
          dispatch(actionsEditor.setUpdatedFormData(null));
          dispatch(actionsEditor.setConfigContentPreChange(""));
          break;
        case "config-review":
          dispatch(actionsEditor.setConfigContent(null));
          break;
        
      }
      return;
    }
    
      const { bucket, prefix } = pathSlice(history.location.pathname);
      const expiry = 5 * 24 * 60 * 60 + 1 * 60 * 60 + 0 * 60;

        return web
          .PresignedGet({
            bucket: prefix,
            object: fileName,
            expiry: expiry
          })
          .then(res => {
            fetch(res.url)
              .then(r => r.text())
              .then(data => {

                switch (type) {
                  case "schema":
                    dispatch(actionsEditor.resetLocalSchemaList());
                    dispatch(actionsEditor.setSchemaContent(JSON.parse(data)));
                    break;
                  case "config":
                    dispatch(actionsEditor.resetLocalConfigList());
                    dispatch(actionsEditor.setConfigContent(JSON.parse(data)));
                    dispatch(actionsEditor.setUpdatedFormData(JSON.parse(data)));
                    dispatch(actionsEditor.setConfigContentPreChange(data));
                    break;
                  case "config-review":
                    dispatch(actionsEditor.setConfigContentPreChange(data));
                    break;
                  default:
                    break;
                }


              })
              .catch(e => {

                switch (true) {
                  case type == "schema":
                    dispatch(actionsEditor.setSchemaContent(null));
                    break;
                  case type == "config":
                    dispatch(actionsEditor.setConfigContent(null));
                    dispatch(actionsEditor.setUpdatedFormData(null));
                    dispatch(actionsEditor.setConfigContentPreChange(null));
                    break;
                  case type == "config-review":
                    dispatch(actionsEditor.setConfigContentPreChange(null));
                    break;
                  default:
                    break;
                }

                window.alert(`Warning: ${fileName} is invalid and was not loaded`);
              });
          })
          .catch(err => {
            if (web.LoggedIn()) {
              window.alert(err.message);
            } else {
              history.push("/login");
            }
          });
    }
};