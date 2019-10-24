import React from "react";
import { connect } from "react-redux";
import * as dashboardActions from "../dashboard/actions";
import * as dashboardStatusActions from "./actions";
import { defaults } from "react-chartjs-2";
import { HorizontalBar, Bar, Line, Doughnut } from "react-chartjs-2";
import Moment from "moment";
import { prepareData, barOptionsFunc } from "./prepareData";
import { RadioGroup, RadioButton } from "react-radio-buttons";

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

    this.handleChange = this.handleChange.bind(this);

    this.state = {
      periodHours: 24 * 7
    };
  }

  handleChange(event) {
    console.log(event.target.value);
    this.setState({
      periodHours: event.target.value
    });
  }

  componentDidMount() {
    this.props.listAllObjects();
  }

  render() {
    const {
      mf4Objects,
      deviceFileContents,
      deviceFileObjects,
      configFileCrc32
    } = this.props;
    const { periodHours } = this.state;

    const dataLoaded =
      Object.keys(mf4Objects).length *
      Object.keys(deviceFileObjects).length *
      Object.keys(deviceFileContents).length *
      Object.keys(configFileCrc32).length;

    let periodEnd = Moment();
    let periodStart = Moment().subtract(periodHours, "hours");

    if (dataLoaded) {
      const chartDataArray = prepareData(
        periodEnd,
        periodHours,
        periodStart,
        mf4Objects,
        deviceFileObjects,
        deviceFileContents,
        configFileCrc32
      );

      const chartData = chartDataArray[0];

      const barOptions = barOptionsFunc(
        this.state.periodHours,
        chartDataArray[1]
      );

      return (
        <div className="feb-container dashboard">
          <div className="period-hours-form">
          <form onSubmit={this.handleSubmit}>
            <label className="period-hours-selector">
              <input
                type="radio"
                name="radios"
                id="radio1"
                value={24 * 30}
                checked={this.state.periodHours == 24 * 30}
                onChange={this.handleChange}
                visibility="hidden"
              />
              <label htmlFor="radio1">&nbsp;monthly&nbsp;</label>
              

            </label>
            <label className="period-hours-selector">
              <input
                type="radio"
                name="radios"
                id="radio2"
                value={24 * 7}
                checked={this.state.periodHours == 24 * 7}
                onChange={this.handleChange}
              />
              <label htmlFor="radio2">&nbsp;weekly&nbsp;</label> 

            </label>
            <label className="period-hours-selector">
              <input
                type="radio"
                name="radios"
                id="radio3"
                value={24}
                checked={this.state.periodHours == 24}
                onChange={this.handleChange}
              />
              <label htmlFor="radio3">&nbsp;daily&nbsp;</label>
            </label>
            <label className="period-hours-selector">
              <input
                type="radio"
                name="radios"
                id="radio4"
                value={1}
                checked={this.state.periodHours == 1}
                onChange={this.handleChange}
              />
              <label htmlFor="radio4">&nbsp;hourly&nbsp;</label>
            </label>
          </form>
          </div>

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
                          // data={{
                          //   datasets: [{
                          //       label: 'Sales',
                          //       type:'line',
                          //       data: [51, 65, 40, 49, 60, 37, 40],
                          //       fill: false,
                          //       borderColor: '#EC932F',
                          //       backgroundColor: '#EC932F',
                          //       pointBorderColor: '#EC932F',
                          //       pointBackgroundColor: '#EC932F',
                          //       pointHoverBackgroundColor: '#EC932F',
                          //       pointHoverBorderColor: '#EC932F',
                          //       yAxisID: 'y-axis-2'
                          //     },{
                          //       type: 'bar',
                          //       label: 'Visitor',
                          //       data: [200, 185, 590, 621, 250, 400, 95],
                          //       fill: false,
                          //       backgroundColor: '#71B37C',
                          //       borderColor: '#71B37C',
                          //       hoverBackgroundColor: '#71B37C',
                          //       hoverBorderColor: '#71B37C',
                          //       yAxisID: 'y-axis-1'
                          //     }]
                          // }}
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
    deviceFileObjects: state.dashboardStatus.deviceFileObjects,
    configFileCrc32: state.dashboardStatus.configFileCrc32
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardStatusSection);
