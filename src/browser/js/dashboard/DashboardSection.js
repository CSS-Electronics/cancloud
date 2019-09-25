import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as dashboardActions from "./actions";
import { BaseChart, BaseMap } from "../charts";
import { defaults } from "react-chartjs-2";

// below will later be put into the server Schema/Config:
let confDash = {
  chart_defaults: {
    timestamp_header: "timestamps",
    device_header: "device_serialno",
    line_border_width: 2,
    point_radius: 0,
    font_size: 8,
    legend_labels_box_width: 10,
    legend_labels_padding: 4,
    show_lines: 0,
    chart_colors:
      "#3d85c6 #ff9900 #073763 #0b5394 #6fa8dc #9fc5e8 #e69138 #f6b26b #f9cb9c"
  },
  widgets: [
    {
      id: "widgetMap",
      title: "Asset position",
      chart_type: "map",
      data_file_name: "line2.csv",
      parameters: "Longitude, Latitude",
      devices: "7F34B296 AB22438D",
      period_sec: 86400,
      start: "",
      end: "2019-04-17 21:18:10",
      class_name: "col-sm-6",
      aspect_ratio: false,
      height: 410, 
      colors: ""
    }
    ,
    {
      id: "widget4",
      title: "Overall Status",
      chart_type: "pie",
      data_file_name: "pie.csv",
      parameters: "type1, type2, type3, type4",
      devices: "",
      period_sec: 86400,
      start: "2019-04-17 18:01:25",
      end: "2019-04-17 21:01:25",
      class_name: "col-sm-2",
      aspect_ratio: false,
      height: 200,
      colors: "#3d3d3d #636363 #858585 #9e9e9e"
    },
    {
      id: "widget5",
      title: "Device Status",
      chart_type: "pie",
      data_file_name: "pie-multiple-devices.csv",
      parameters: "type1, type2, type3, type4",
      devices: "7F34B296 AB22438D",
      period_sec: 86400,
      start: "2019-04-15 18:01:25",
      end: "2019-04-18 21:01:25",
      class_name: "col-sm-2",
      aspect_ratio: false,
      height: 200,
      colors: ""
    },
    {
      id: "widget7",
      title: "Device Status",
      chart_type: "pie",
      data_file_name: "pie-multiple-devices.csv",
      parameters: "type1, type2, type3, type4",
      devices: "7F34B296 AB22438D",
      period_sec: 86400,
      start: "2019-04-15 18:01:25",
      end: "2019-04-18 21:01:25",
      class_name: "col-sm-2",
      aspect_ratio: false,
      height: 200,
      colors: ""
    }
    ,
    {
      id: "widget6",
      title: "Device Status",
      chart_type: "horizontal-bar",
      data_file_name: "pie-multiple-devices.csv",
      parameters: "type1, type2, type3, type4",
      devices: "7F34B296 AB22438D",
      period_sec: 86400,
      start: "2019-04-15 18:01:25",
      end: "2019-04-18 21:01:25",
      class_name: "col-sm-6",
      aspect_ratio: false,
      height: 200,
      colors: ""
    }
    ,
    {
      id: "widget1",
      title: "Engine Speed (rpm)",
      chart_type: "line",
      data_file_name: "line2.csv",
      parameters: "EngineSpeed",
      devices: "7F34B296 AB22438D",
      period_sec: 86400,
      start: "2019-04-17 21:01:25",
      end: "2019-04-17 21:09:25",
      class_name: "col-sm-4",
      aspect_ratio: false,
      height: 200,
      colors: ""
    }
    ,
    {
      id: "widget2",
      title: "Vehicle Speed (km/h)",
      chart_type: "line",
      data_file_name: "line2.csv",
      parameters: "WheelBasedVehicleSpeed",
      devices: "7F34B296 AB22438D",
      period_sec: 86400,
      start: "2019-04-17 21:01:25",
      end: "2019-04-17 21:09:25",
      class_name: "col-sm-4",
      aspect_ratio: false,
      height: 200,
      colors: ""
    },
    {
      id: "widget3",
      title: "Engine Fuel Rate",
      chart_type: "line",
      data_file_name: "line2.csv",
      parameters: "EngineFuelRate",
      devices: "7F34B296 AB22438D",
      period_sec: 86400,
      start: "2019-04-17 21:01:25",
      end: "2019-04-17 21:09:25",
      class_name: "col-sm-4",
      aspect_ratio: false,
      height: 200,
      colors: ""
    }
  ]
};


// set chart defaults
let chDefaults = confDash.chart_defaults;
let chartColors = chDefaults.chart_colors.split(" ");

defaults.global.elements.line.borderWidth = chDefaults.line_border_width;
defaults.global.elements.point.radius = chDefaults.point_radius;
defaults.global.defaultFontSize = chDefaults.font_size;
defaults.global.legend.labels.boxWidth = chDefaults.legend_labels_box_width;
defaults.global.legend.labels.padding = chDefaults.legend_labels_padding;
defaults.global.showLines = chDefaults.show_lines;
defaults.global.maintainAspectRatio = chDefaults.aspect_ratio;
// defaults.global.animation.duration = 5000
// defaults.global.animation.easing = "linear"


class DashboardSection extends React.Component {
  constructor(props) {
    super(props);
  }

  // S3 select the data
  componentWillMount() {
    this.props.prepareWidgetInputs(confDash);
  }

  render() {
    const { recordsArray } = this.props;

    return (
      <div className="feb-container dashboard">
        {recordsArray.length != 0 ? (
          <div>
            {recordsArray.map((records, i) => (
              <div
                key={confDash.widgets[i].id}
                className={"zero-padding " + confDash.widgets[i].class_name}
              >
                <div
                  className="dashboard-widget"
                  style={{ height: confDash.widgets[i].height }}
                >
                  <span className="widget-title">
                    {confDash.widgets[i].title}
                  </span>

                  <div style={{ marginTop: 5 }}>
                    {confDash.widgets[i].chart_type != "map" ? (
                      <BaseChart
                        chartType={confDash.widgets[i].chart_type}
                        chartColors={confDash.widgets[i].colors ? confDash.widgets[i].colors.split(" ") : chartColors}
                        aspectRatio={confDash.widgets[i].aspect_ratio}
                        chHeight={confDash.widgets[i].height - 60}
                        datasets={
                          records.records ? records.records.dataset : null
                        }
                      />
                    ) : (
                      <BaseMap 
                        chartColors={confDash.widgets[i].colors ? confDash.widgets[i].colors.split(" ") : chartColors}
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
    recordsArray: state.dashboard.widget
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardSection);
