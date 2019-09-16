import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as dashboardActions from "./actions";
import { LineChart } from "../charts";
import { defaults } from "react-chartjs-2";

// example select statements
// "SELECT time_date, EngineSpeed FROM S3Object WHERE EngineSpeed > '0' limit 200"
// "SELECT time_date, EngineSpeed FROM S3Object WHERE device_serialno in ['7F34B296'] and time_date > '2019-04-17 21:01:25' and time_date < '2019-04-17 21:05:25' limit 800"

// Notes:
// Schema to force that minimum one default device is included

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
    show_lines: 0
  },
  widgets: [
    {
      id: "widget1",
      title: "Engine Speed (rpm)",
      chart_type: "line",
      data_file_name: "test.csv",
      parameters: "EngineSpeed",
      def_devices: "'7F34B296', 'AB22438D'",
      def_start: "2019-04-17 21:01:25",
      def_end: "2019-04-17 21:09:25",
      limit: 800,
      class_name: "col-sm-4"
    },
    {
      id: "widget2",
      title: "Vehicle Speed (km/h)",
      chart_type: "line",
      data_file_name: "test.csv",
      parameters: "WheelBasedVehicleSpeed",
      def_devices: "'7F34B296', 'AB22438D'",
      def_start: "2019-04-17 21:01:25",
      def_end: "2019-04-17 21:09:25",
      limit: 800,
      class_name: "col-sm-4"
    },
    {
      id: "widget3",
      title: "Engine Fuel Rate",
      chart_type: "line",
      data_file_name: "test.csv",
      parameters: "EngineFuelRate",
      def_devices: "'7F34B296', 'AB22438D'",
      def_start: "2019-04-17 21:01:25",
      def_end: "2019-04-17 21:09:25",
      limit: 800,
      class_name: "col-sm-4"
    }
  ]
};

// set chart defaults
let chDefaults = configDashboard.chart_defaults;
defaults.global.elements.line.borderWidth = chDefaults.line_border_width;
defaults.global.elements.point.radius = chDefaults.point_radius;
defaults.global.defaultFontSize = chDefaults.font_size;
defaults.global.legend.labels.boxWidth = chDefaults.legend_labels_box_width;
defaults.global.legend.labels.padding = chDefaults.legend_labels_padding;
defaults.global.showLines = chDefaults.show_lines;


function DashboardWidget(props) {
  return (
    <div className={"zero-padding " + props.className}>
      <div className="dashboard-widget">
        <span>{props.widgetTitle}</span>
        <LineChart datasets={props.records.records ? props.records.records.dataset : null} />
      </div>
    </div>
  );
}


class DashboardSection extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.props.prepareWidgetInputs(configDashboard);
  }

  render() {
    const { recordsArray } = this.props;

    return (
      <div className="feb-container dashboard">
        {recordsArray.length != 0 ? 
        <div>{recordsArray.map((records, i) => (
          <DashboardWidget
            key={i}
            widgetTitle={configDashboard.widgets[i].title}
            className={configDashboard.widgets[i].class_name}
            records={records}
          />
        ))}</div> : null}
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
