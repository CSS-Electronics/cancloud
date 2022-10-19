// import * as editorActions from "./editorBase/actions";
import {editorActions} from "config-editor-base"
import web from "../web";
import history from "../history";
import * as alertActions from "../alert/actions";

import { isValidUISchema, isValidSchema, isValidConfig, pathSlice } from "../utils";

export const fetchFilesS3 = (prefix) => {
  return function (dispatch) {

    // list & load devive specific Rule Schemas and Configuration Files
    return web
      .ListObjects({
        bucketName: prefix,
        prefix: "",
        marker: "",
      })
      .then((data) => {
        let allObjects = [];
        allObjects = data.objects.map((object) => object.name.split("/")[0]);

        // Rule Schemas
        let schemaFiles = allObjects
          .filter((str) => isValidSchema(str))
          .sort()
          .reverse();

        dispatch(editorActions.setSchemaFile(schemaFiles));
        if(schemaFiles.length){
          dispatch(fetchFileContentS3(schemaFiles[0], "schema"));
        }

        // Configuration Files
        let configFiles = allObjects
          .filter((str) => isValidConfig(str))
          .sort()
          .reverse();

        dispatch(editorActions.setConfigFile(configFiles));
        if(configFiles.length){
          dispatch(fetchFileContentS3(configFiles[0], "config"));
        }

        // UIschemas
        let uischemaFiles = allObjects
        .filter((str) => isValidUISchema(str))
        .sort()
        .reverse();

        dispatch(editorActions.setUISchemaFile(uischemaFiles));

        if(uischemaFiles.length){
          dispatch(editorActions.resetUISchemaList());
          dispatch(editorActions.setUISchemaFile(uischemaFiles));
          dispatch(fetchFileContentS3(uischemaFiles[0], "uischema"));
        }

      })
      .catch((err) => {
        if (web.LoggedIn()) {
          window.alert(err.message);
        } else {
          history.push("/login");
        }
      });
  };
};

// fetch file contents from S3 for Rule Schema or Configuration Files
// This should only be triggered when selecting a non-embedded and non-uploaded file
export const fetchFileContentS3 = (fileName, type) => {

  return function (dispatch) {
    if (fileName == "None") {
      switch (type) {
        case "uischema":
          dispatch(editorActions.resetLocalUISchemaList());
          dispatch(editorActions.setUISchemaContent(null));
          break;
        case "schema":
          dispatch(editorActions.resetLocalSchemaList());
          dispatch(editorActions.setSchemaContent(null));
          break;
        case "config":
          dispatch(editorActions.resetLocalConfigList());
          dispatch(editorActions.setConfigContent(null));
          dispatch(editorActions.setUpdatedFormData(null));
          dispatch(editorActions.setConfigContentPreChange(""));
          break;
        case "config-review":
          dispatch(editorActions.setConfigContentPreChange(""));
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
        expiry: expiry,
      })
      .then((res) => {
        fetch(res.url)
          .then((r) => r.text())
          .then((data) => {
            switch (type) {
              case "uischema":
                dispatch(editorActions.resetLocalUISchemaList());
                dispatch(editorActions.setUISchemaContent(JSON.parse(data)));
                break;
              case "schema":
                dispatch(editorActions.resetLocalSchemaList());
                dispatch(editorActions.setSchemaContent(JSON.parse(data)));
                break;
              case "config":
                dispatch(editorActions.resetLocalConfigList());
                dispatch(editorActions.setConfigContent(JSON.parse(data)));
                dispatch(editorActions.setUpdatedFormData(JSON.parse(data)));
                dispatch(editorActions.setConfigContentPreChange(data));
                break;
              case "config-review":
                dispatch(editorActions.setConfigContentPreChange(data));
                break;
              default:
                break;
            }
          })
          .catch((e) => {
            switch (true) {
              case type == "uischema":
                dispatch(editorActions.setUISchemaContent(null));
                break;
              case type == "schema":
                dispatch(editorActions.setSchemaContent(null));
                break;
              case type == "config":
                dispatch(editorActions.setConfigContent(null));
                dispatch(editorActions.setUpdatedFormData(null));
                dispatch(editorActions.setConfigContentPreChange(null));
                break;
              case type == "config-review":
                dispatch(editorActions.setConfigContentPreChange(null));
                break;
              default:
                break;
            }

            window.alert(`Warning: ${fileName} is invalid and was not loaded`);
          });
      })
      .catch((err) => {
        if (web.LoggedIn()) {
          window.alert(err.message);
        } else {
          history.push("/login");
        }
      });
  };
};

export const updateConfigFileS3 = (content, configName) => {
  const { bucket, prefix } = pathSlice(history.location.pathname);

  return function (dispatch) {
    dispatch(editorActions.setConfigContent(JSON.parse(content)));
    dispatch(editorActions.setConfigContentPreChange(content));

    return web
      .PutObject({
        objectName: prefix + "/" + configName,
        file: content,
      })
      .then((res) => {
        dispatch(
          alertActions.set({
            type: "info",
            message: `New configuration file, ${configName} successfully created`,
            autoClear: true,
          })
        );
      })
      .catch((err) => {
        if (web.LoggedIn()) {
          dispatch(
            alertActions.set({
              type: "danger",
              message: "Unable to update the configuration file",
              autoClear: true,
            })
          );
        } else {
          history.push("/login");
        }
      });
  };
};
