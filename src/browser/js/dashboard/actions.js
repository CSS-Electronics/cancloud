import web from "../web";
import * as alertActions from "../alert/actions";
export const WIDGET_RESULT = "dashboard/WIDGET_RESULT";

export const prepareWidgetInputs = configDashboard => {
  let chDefaults = configDashboard.chart_defaults;

  let recordsArray = _.map(configDashboard.widgets, widget =>
    web.getWidgetQueryResult({
      dataFileName: widget.data_file_name,
      sqlExpression:
        widget.chart_type == "line"
          ? `SELECT ${chDefaults.device_header}, ${
              chDefaults.timestamp_header
            }, ${widget.parameters} FROM S3Object WHERE ${
              chDefaults.device_header
            } in [${"'" +
              widget.def_devices.replace(/ /g, "', '") +
              "'"}] and ${chDefaults.timestamp_header} > '${
              widget.def_start
            }' and ${chDefaults.timestamp_header} < '${widget.def_end}' limit ${
              widget.limit
            }`
          : widget.chart_type == "pie"
          ? `SELECT ${chDefaults.device_header}, ${chDefaults.timestamp_header}, ${widget.parameters} FROM S3Object`
          : null
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
