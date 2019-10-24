import web from "../web";
import * as alertActions from "../alert/actions";
import Moment from "moment";
export const WIDGET_RESULT = "dashboard/WIDGET_RESULT";

const currentTimestamp = Moment();

// Create S3 Select call to get max of timestamp column across all devices
export const prepareWidgetInputs = configDashboard => {
  let chDefaults = configDashboard.default_settings;

  let recordsArray = _.map(configDashboard.widgets, widget =>
    web.getWidgetQueryResult({
      dataFileName: widget.data_file_name,
      sqlExpression: 
      `SELECT ${chDefaults.segment_header}, ${
        chDefaults.timestamp_header
      }, ${widget.parameters.trim().replace(/ /g, ", ")} FROM S3Object WHERE ${
        widget.segments
          ? chDefaults.segment_header +
            " in ('" +
            widget.segments.replace(/ /g, "', '") +
            "') and "
          : ""
      } ${chDefaults.timestamp_header} > '${
        widget.start
          ? widget.start
          : widget.end
          ? Moment(widget.end)
              .subtract(widget.period_sec, "seconds")
              .format("YYYY-MM-DD HH:mm:ss")
          : Moment()
              .subtract(widget.period_sec, "seconds")
              .format("YYYY-MM-DD HH:mm:ss")
      }' and ${chDefaults.timestamp_header} < '${
        widget.end ? widget.end : Moment().format("YYYY-MM-DD HH:mm:ss")
      }'`
    })
  );
  
  return function(dispatch) {
    Promise.all(recordsArray)
      .then(res => dispatch(widgetData(res)))
      .catch(error => {
        if (web.LoggedIn()) {
          dispatch(
            alertActions.set({
              type: "danger",
              message: error.message,
              autoClear: true
            })
          );
        } else {
          history.push("/login");
        }
      });
  };
};

export const widgetData = record => ({
  type: WIDGET_RESULT,
  record
});
