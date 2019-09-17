import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as dashboardActions from "./actions";
import { LineChart, DoughnutChart, BaseChart } from "../charts";
import { defaults } from "react-chartjs-2";

// FIGURE OUT HOW TO CONTROL THE HEIGHT

// below will later be put into the server Schema/Config:
let configDashboard = {
  chart_defaults: {
    timestamp_header: "time_stamp",
    device_header: "device_serialno",
    line_border_width: 2,
    point_radius: 0,
    font_size: 8,
    legend_labels_box_width: 10,
    legend_labels_padding: 4,
    show_lines: 0,
    chart_colors:
      "#3d85c6 #ff9900 #073763 #0b5394 #6fa8dc #9fc5e8 #e69138 f6b26b #f9cb9c"
  },
  widgets: [
    {
      id: "widget1",
      title: "Engine Speed (rpm)",
      chart_type: "line",
      data_file_name: "line.csv",
      parameters: "EngineSpeed",
      def_devices: "7F34B296 AB22438D",
      def_start: "2019-04-17 21:01:25",
      def_end: "2019-04-17 21:09:25",
      limit: 800,
      class_name: "col-sm-4",
      aspect_ratio: true,
      height: 0
    },
    {
      id: "widget2",
      title: "Vehicle Speed (km/h)",
      chart_type: "line",
      data_file_name: "line.csv",
      parameters: "WheelBasedVehicleSpeed",
      def_devices: "7F34B296 AB22438D",
      def_start: "2019-04-17 21:01:25",
      def_end: "2019-04-17 21:09:25",
      limit: 800,
      class_name: "col-sm-4",
      aspect_ratio: true,
      height: 0
    },
    {
      id: "widget3",
      title: "Engine Fuel Rate",
      chart_type: "line",
      data_file_name: "line.csv",
      parameters: "EngineFuelRate",
      def_devices: "7F34B296 AB22438D",
      def_start: "2019-04-17 21:01:25",
      def_end: "2019-04-17 21:09:25",
      limit: 800,
      class_name: "col-sm-4",
      aspect_ratio: true,
      height: 0
    },
    {
      id: "widget4",
      title: "Device Status",
      chart_type: "pie",
      data_file_name: "pie.csv",
      parameters: "type1, type2, type3, type4",
      def_devices: "ALL",
      def_start: "2019-04-17 18:01:25",
      def_end: "2019-04-17 21:01:25",
      limit: 800,
      class_name: "col-sm-2",
      aspect_ratio: false,
      height: 0
    }
  ]
};

// set chart defaults
let chDefaults = configDashboard.chart_defaults;
let chartColors = chDefaults.chart_colors.split(" ");
defaults.global.elements.line.borderWidth = chDefaults.line_border_width;
defaults.global.elements.point.radius = chDefaults.point_radius;
defaults.global.defaultFontSize = chDefaults.font_size;
defaults.global.legend.labels.boxWidth = chDefaults.legend_labels_box_width;
defaults.global.legend.labels.padding = chDefaults.legend_labels_padding;
defaults.global.showLines = chDefaults.show_lines;
defaults.global.maintainAspectRatio = chDefaults.aspect_ratio;


function DashboardWidget(props) {
  return (
    <div className={"zero-padding " + props.className}>
      <div className="dashboard-widget">
        <span>{props.widgetTitle}</span>
        <BaseChart
            chartType={props.chartType}
            chartColors={chartColors}
            aspectRatio={props.aspectRatio}
            chHeight={props.chHeight}
            datasets={
              props.records.records ? props.records.records.dataset : null
            }
          />
      </div>
    </div>
  );
}

class DashboardSection extends React.Component {
  constructor(props) {
    super(props);
  }

  // S3 select the data
  componentWillMount() {
    this.props.prepareWidgetInputs(configDashboard);
  }

  render() {
    const { recordsArray } = this.props;

    return (
      <div className="feb-container dashboard">
        {recordsArray.length != 0 ? (
          <div>
            {recordsArray.map((records, i) => (
              <DashboardWidget
                key={i}
                widgetTitle={configDashboard.widgets[i].title}
                chartType={configDashboard.widgets[i].chart_type}
                className={configDashboard.widgets[i].class_name}
                chWidth={configDashboard.widgets[i].width}
                chHeight={configDashboard.widgets[i].height}
                aspectRatio={configDashboard.widgets[i].aspect_ratio}
                records={records}
              />
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
