import React from "react";
import { connect } from "react-redux";
import * as dashboardActions from "../dashboard/actions";
import * as dashboardStatusActions from "./actions";
import { defaults } from "react-chartjs-2";
import { HorizontalBar, Bar, Doughnut } from "react-chartjs-2";
import Moment from "moment";
import { prepareData } from "./prepareData";

const statusConfig = require(`../../schema/status-config-03.01.json`);

let confDash = statusConfig.dashboard;
let chDefaults = confDash.default_settings;
let chColors = chDefaults.chart_colors.split(" ");
let wgt = confDash.widgets;

defaults.global.elements.line.borderWidth = chDefaults.line_border_width;
defaults.global.elements.point.radius = chDefaults.point_radius;
defaults.global.defaultFontSize = chDefaults.chart_font_size;
defaults.global.legend.labels.boxWidth = chDefaults.legend_labels_box_width;
defaults.global.legend.labels.padding = chDefaults.legend_labels_padding;

const barOptions = {
  maintainAspectRatio: false,
  legend: {
    display: false
  },
  scales: {
    xAxes: [
      {
        gridLines: { display: false },
        ticks: {
          beginAtZero: true
        },
        type: "time",
        time: {
          unit: "hour",
          displayFormats: {
            hour: "MM/DD h",
            day: "MM/DD"
          }
        }
      }
    ]
  }
};

let pieOptions = {
  maintainAspectRatio: false,
  tooltips: {
    callbacks: {
      label: function(item, data) {
        return (
          data.datasets[item.datasetIndex].label +
          ": " +
          data.datasets[item.datasetIndex].data[item.index]
        );
      }
    }
  }
};

class DashboardStatusSection extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.listAllObjects();
  }

  render() {
    const { mf4Objects, deviceFileContents, deviceFileObjects } = this.props;

    let chartData = {};
    const dataLoaded =
      Object.keys(mf4Objects).length *
      Object.keys(deviceFileObjects).length *
      Object.keys(deviceFileContents).length;

    let periodEnd = Moment();
    let periodHours = 24 * 7;
    let periodStart = Moment().subtract(periodHours, "hours");

    if (dataLoaded) {
      chartData = prepareData(
        periodEnd,
        periodHours,
        periodStart,
        mf4Objects,
        deviceFileObjects,
        deviceFileContents
      );

      return (
        <div className="feb-container dashboard">
          {dataLoaded ? (
            <div>
              {wgt.map((widget, i) => (
                <div
                  key={"widget " + i}
                  className={
                    "zero-padding " +
                    (widget.class_name ? widget.class_name : "col-sm-4")
                  }
                >
                  <div
                    className="dashboard-widget"
                    style={{ height: widget.height }}
                  >
                    <span className="widget-title">
                      {widget.title ? widget.title : null}
                    </span>

                    <div style={{ marginTop: 5 }}>
                      {widget.widget_type == "kpi" ? (
                        <div
                          className="widget-kpi"
                          style={{ color: chColors[0] }}
                        >
                          {chartData[widget.dataset]}
                        </div>
                      ) : null}

                      {widget.widget_type == "pie" ? (
                        <Doughnut
                          data={chartData[widget.dataset]}
                          height={widget.height - 60}
                          options={pieOptions}
                        />
                      ) : null}

                      {widget.widget_type == "bar" ? (
                        <Bar
                          data={chartData[widget.dataset]}
                          height={widget.height - 60}
                          options={barOptions}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );
    } else {
      return null;
    }
  }
}

const mapDispatchToProps = dispatch => ({
  listAllObjects: () => dispatch(dashboardStatusActions.listAllObjects())
});

const mapStateToProps = state => {
  return {
    mf4Objects: state.dashboardStatus.objectsData,
    deviceFileContents: state.dashboardStatus.deviceFileContents,
    deviceFileObjects: state.dashboardStatus.deviceFileObjects
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardStatusSection);
