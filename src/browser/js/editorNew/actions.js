import * as actionsEditor from "./editorBase/actions";
import web from "../web";
import history from "../history";
import * as alertActions from "../alert/actions";

import { isValidSchema, isValidConfig, pathSlice } from "../utils";

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

        dispatch(actionsEditor.setSchemaFile(schemaFiles));
        dispatch(fetchFileContentS3(schemaFiles[0], "schema"));

        // Configuration Files
        let configFiles = allObjects
          .filter((str) => isValidConfig(str))
          .sort()
          .reverse();

        dispatch(actionsEditor.setConfigFile(configFiles));
        dispatch(fetchFileContentS3(configFiles[0], "config"));
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
// This should only be triggered by non UIschema dropdowns
export const fetchFileContentS3 = (fileName, type) => {
  return function (dispatch) {
    if (fileName == "None") {
      switch (type) {
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
          dispatch(actionsEditor.setConfigContentPreChange(""));
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
          .catch((e) => {
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
    dispatch(actionsEditor.setConfigContent(JSON.parse(content)));
    dispatch(actionsEditor.setConfigContentPreChange(content));

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
