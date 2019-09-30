import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as dashboardActions from "./actions";
import { BaseChart, BaseMap, BaseTable } from "../charts";
import { defaults } from "react-chartjs-2";

// below will later be put into the server Schema/Config:
// let confDash = {
//   default_settings: {
//     timestamp_header: "timestamps",
//     device_header: "device_serialno",
//     line_border_width: 2,
//     point_radius: 0,
//     chart_font_size: 8,
//     table_font_size: 11,
//     legend_labels_box_width: 10,
//     legend_labels_padding: 4,
//     chart_colors:
//       "#3d85c6 #ff9900 #073763 #0b5394 #6fa8dc #9fc5e8 #e69138 #f6b26b #f9cb9c"
//   },
//   widgets: [
//     {
//       title: "Asset position",
//       widget_type: "map",
//       data_file_name: "server/line2.csv",
//       parameters: "Longitude Latitude",
//       devices: "7F34B296 AB22438D",
//       period_sec: 86400,
//       start: "",
//       end: "2019-04-17 21:18:10",
//       class_name: "col-sm-6",
//       aspect_ratio: 0,
//       height: 410,
//       colors: ""
//     },
//     {
//       title: "Overall Status",
//       widget_type: "pie",
//       data_file_name: "pie.csv",
//       parameters: "type1 type2 type3 type4",
//       devices: "",
//       period_sec: 86400,
//       start: "2019-04-17 18:01:25",
//       end: "2019-04-17 21:01:25",
//       class_name: "col-sm-2",
//       aspect_ratio: 0,
//       height: 200,
//       colors: "#3d3d3d #636363 #858585 #9e9e9e"
//     },
//     {
//       title: "Device Status",
//       widget_type: "pie",
//       data_file_name: "pie-multiple-devices.csv",
//       parameters: "type1 type2 type3 type4",
//       devices: "7F34B296 AB22438D",
//       period_sec: 86400,
//       start: "2019-04-15 18:01:25",
//       end: "2019-04-18 21:01:25",
//       class_name: "col-sm-2",
//       aspect_ratio: 0,
//       height: 200,
//       colors: ""
//     },
//     {
//       title: "KPI X",
//       widget_type: "kpi",
//       data_file_name: "kpi.csv",
//       parameters: "kpi_x",
//       devices: "ALL",
//       period_sec: 0,
//       start: "2019-04-17 19:45:00",
//       end: "2019-04-17 19:46:00",
//       class_name: "col-sm-2",
//       aspect_ratio: 0,
//       height: 95,
//       colors: ""
//     },
//     {
//       title: "KPI Y",
//       widget_type: "kpi",
//       data_file_name: "kpi.csv",
//       parameters: "kpi_x",
//       devices: "ALL",
//       period_sec: 0,
//       start: "2019-04-16 19:45:00",
//       end: "2019-04-16 19:46:00",
//       class_name: "col-sm-2",
//       aspect_ratio: 0,
//       height: 95,
//       colors: ""
//     },
//     {
//       title: "Device Status",
//       widget_type: "horizontal-bar",
//       data_file_name: "pie-multiple-devices.csv",
//       parameters: "type1 type2 type3 type4",
//       devices: "7F34B296 AB22438D",
//       period_sec: 86400,
//       start: "2019-04-15 18:01:25",
//       end: "2019-04-18 21:01:25",
//       class_name: "col-sm-6",
//       aspect_ratio: 0,
//       height: 200,
//       colors: ""
//     },
//     {
//       title: "Engine Speed (rpm)",
//       widget_type: "line",
//       data_file_name: "line2.csv",
//       parameters: "EngineSpeed",
//       devices: "7F34B296 AB22438D",
//       period_sec: 86400,
//       start: "2019-04-17 21:01:25",
//       end: "2019-04-17 21:09:25",
//       class_name: "col-sm-4",
//       aspect_ratio: 0,
//       height: 200,
//       colors: ""
//     },
//     {
//       title: "Vehicle Speed (km/h)",
//       widget_type: "line",
//       data_file_name: "line2.csv",
//       parameters: "WheelBasedVehicleSpeed",
//       devices: "7F34B296 AB22438D",
//       period_sec: 86400,
//       start: "2019-04-17 21:01:25",
//       end: "2019-04-17 21:09:25",
//       class_name: "col-sm-4",
//       aspect_ratio: 0,
//       height: 200,
//       colors: ""
//     },
//     {
//       title: "Engine Fuel Rate",
//       widget_type: "line",
//       data_file_name: "line2.csv",
//       parameters: "EngineFuelRate",
//       devices: "7F34B296 AB22438D",
//       period_sec: 86400,
//       start: "2019-04-17 21:01:25",
//       end: "2019-04-17 21:09:25",
//       class_name: "col-sm-4",
//       aspect_ratio: 0,
//       height: 200,
//       colors: ""
//     }
//     ,
//     {
//       title: "Vehicle DTC Overview",
//       widget_type: "table",
//       data_file_name: "table.csv",
//       parameters: "DTC_time device DTC DTC_count",
//       devices: "ALL",
//       period_sec: 0,
//       start: "2019-04-17 19:45:00",
//       end: "2019-04-17 19:46:00",
//       class_name: "col-sm-6",
//       aspect_ratio: 0,
//       height: 200,
//       colors: ""
//     }
//     ,
//     {
//       title: "Driver Status Trailing 7 Days",
//       widget_type: "table",
//       data_file_name: "table-drivers.csv",
//       parameters: "Device Driver FuelRate_AVG Km_Day HardBreaks_100Km",
//       devices: "ALL",
//       period_sec: 0,
//       start: "2019-04-17 19:45:00",
//       end: "2019-04-17 19:46:00",
//       class_name: "col-sm-6",
//       aspect_ratio: 0,
//       height: 200,
//       colors: ""
//     }
//   ]
// };


let confDash = null
let chDefaults = null
let chColors = []

// set chart defaults
class DashboardSection extends React.Component {
  constructor(props) {
    super(props);
  }

  // componentWillMount() {
  //     this.props.prepareWidgetInputs(confDash);
  // }

  render() {
    const { recordsArray, serverConfig } = this.props;

    if (Object.keys(serverConfig).length > 0){
      confDash = serverConfig.dashboard
      chDefaults = confDash.default_settings;
      chColors = chDefaults.chart_colors.split(" ");

      defaults.global.elements.line.borderWidth = chDefaults.line_border_width;
      defaults.global.elements.point.radius = chDefaults.point_radius;
      defaults.global.defaultFontSize = chDefaults.chart_font_size;
      defaults.global.legend.labels.boxWidth = chDefaults.legend_labels_box_width;
      defaults.global.legend.labels.padding = chDefaults.legend_labels_padding;

      this.props.prepareWidgetInputs(serverConfig.dashboard);

    }

    return (
      <div className="feb-container dashboard">
        {(confDash != null && recordsArray.length != 0) ? (
          <div>
            {recordsArray.map((records, i) => (
              <div
                key={"widget " + i}
                className={
                  "zero-padding " +
                  (confDash.widgets[i].class_name
                    ? confDash.widgets[i].class_name
                    : "col-sm-4")
                }
              >
                <div
                  className="dashboard-widget"
                  style={{ height: confDash.widgets[i].height }}
                >
                  <span className="widget-title">
                    {confDash.widgets[i].title
                      ? confDash.widgets[i].title
                      : null}
                  </span>

                  <div style={{ marginTop: 5 }}>
                    {!["kpi", "map", "table"].includes(
                      confDash.widgets[i].widget_type
                    ) ? (
                      <BaseChart
                        chartType={confDash.widgets[i].widget_type}
                        chColors={
                          confDash.widgets[i].colors
                            ? confDash.widgets[i].colors.split(" ")
                            : chColors
                        }
                        aspectRatio={confDash.widgets[i].aspect_ratio}
                        chHeight={confDash.widgets[i].height - 60}
                        datasets={
                          records.records ? records.records.dataset : null
                        }
                      />
                    ) : ["kpi", "table"].includes(
                        confDash.widgets[i].widget_type
                      ) ? (
                      <BaseTable
                        chartType={confDash.widgets[i].widget_type}
                        chColors={
                          confDash.widgets[i].colors
                            ? confDash.widgets[i].colors.split(" ")
                            : chColors
                        }
                        chHeight={confDash.widgets[i].height - 50}
                        fontSize={chDefaults.table_font_size}
                        datasets={
                          records.records ? records.records.dataset : null
                        }
                      />
                    ) : (
                      <BaseMap
                        chColors={
                          confDash.widgets[i].colors
                            ? confDash.widgets[i].colors.split(" ")
                            : chColors
                        }
                        chHeight={confDash.widgets[i].height - 50}
                        datasets={
                          records.records ? records.records.dataset : null
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  prepareWidgetInputs: bindActionCreators(
    dashboardActions.prepareWidgetInputs,
    dispatch
  )
});

const mapStateToProps = state => {
  return {
    recordsArray: state.dashboard.widget,
    serverConfig: state.browser.serverConfig
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardSection);
