import React from "react";
import { connect } from "react-redux";
import * as dashboardStatusActions from "./actions";
import { defaults } from "react-chartjs-2";
import { Bar, Doughnut } from "react-chartjs-2";
import Moment from "moment";
import { prepareData, barOptionsFunc, pieOptionsFunc, pieMultiOptionsFunc } from "./prepareData";
import DeviceTable from "./DeviceTable";

// https://stackoverflow.com/questions/42394429/aws-sdk-s3-best-way-to-list-all-keys-with-listobjectsv2

const statusConfig = require(`../../schema/status-config-03.01.json`);
const resWide = window.innerWidth > 2000 ? 1 : 0;
const now = Moment()

let confDash = statusConfig.dashboard;
let chDefaults = confDash.default_settings;
let chColors = chDefaults.chart_colors.split(" ");
let wgt = confDash.widgets;

defaults.global.elements.line.borderWidth = chDefaults.line_border_width;
defaults.global.elements.point.radius = chDefaults.point_radius;
defaults.global.defaultFontSize = resWide ? 12 : chDefaults.chart_font_size;
defaults.global.legend.labels.boxWidth = chDefaults.legend_labels_box_width;
defaults.global.legend.labels.padding = chDefaults.legend_labels_padding;
defaults.global.animation.duration = 500;
// defaults.global.animation.easing = "linear"

let pieOptions = pieOptionsFunc();
let pieMultiOptions = pieMultiOptionsFunc();

class DashboardStatusSection extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);

    this.state = {
      periodHours: 24 * 7,
      renderDelay: false
    };
  }

  handleChange(event) {
    this.setState({
      periodHours: event.target.value
    });
  }

  componentDidMount() {
    this.props.listAllObjects();

    setTimeout(
      function() {
        this.setState({ renderDelay: true });
      }.bind(this),
      4000
    );
  }

  componentWillUnmount() {
    this.props.setObjectsData({});
    this.props.setConfigObjects([]);
    this.props.deviceFileContent([]);
    this.props.loadedAll(false);
  }

  render() {
    const {
      mf4Objects,
      deviceFileContents,
      deviceFileObjects,
      configFileCrc32,
      serverConfig,
      loaded
    } = this.props;

    const { periodHours, renderDelay} = this.state;
    
    const dataLoaded =
      Object.keys(mf4Objects).length *
      Object.keys(deviceFileObjects).length *
      Object.keys(deviceFileContents).length 
      // *
      // Object.keys(configFileCrc32).length;

    let periodEnd = Moment();
    let periodStart = Moment().subtract(periodHours, "hours");

    if (!loaded) {
      return (
        <div className="feb-container dashboard">
          <p className="loading-dots">Loading data</p>
          {renderDelay ? (
            <p className="loading-delay">(this may take a while)</p>
          ) : null}
        </div>
      );
    }

    if (dataLoaded) {
      const chartDataArray = prepareData(
        periodEnd,
        periodHours,
        periodStart,
        mf4Objects,
        deviceFileObjects,
        deviceFileContents,
        configFileCrc32,
        now
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
                  style={{
                    height:
                      widget.height +
                      (widget.widget_type != "kpi" && resWide ? 100 : 0)
                  }}
                >
                  <div className="field-string">
                    <span className="widget-title">
                      {widget.title ? widget.title : null}
                    </span>
                    {widget.comment ? (
                      <p className="field-description field-description-shift">
                        {widget.comment}
                      </p>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 5 }}>
                    {widget.widget_type == "kpi" ? (
                      <div
                        className="widget-kpi"
                        style={{ color: chColors[0] }}
                      >
                        {chartData[widget.dataset]}
                      </div>
                    ) : null}

                    {widget.widget_type == "pie" && chartDataArray[2].length ? (
                      <Doughnut
                        data={chartData[widget.dataset]}
                        height={widget.height - 60 + (resWide ? 100 : 0)}
                        options={widget.dataset == "deviceConfigFW" ? pieMultiOptions : pieOptions}
                      />
                    ) : null}

                    {widget.widget_type == "bar" ? (
                      <Bar
                        data={chartData[widget.dataset]}
                        height={widget.height - 60 + (resWide ? 100 : 0)}
                        options={barOptions}
                      />
                    ) : null}

                    {widget.widget_type == "table" ? (
                      <div
                        style={{ height: widget.height + (resWide ? 100 : 0) }}
                      >
                        <DeviceTable
                          deviceIdListDeltaSort={chartDataArray[2]}
                          deviceFileContents={deviceFileContents}
                          configFileCrc32={configFileCrc32}
                          serverConfig={serverConfig}
                          mf4ObjectsFiltered={chartDataArray[3]}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (loaded && !dataLoaded) {
      return (
        <div className="feb-container dashboard">
          <br/>
          <p className="loading-delay">No data to display</p>
        </div>
      );
    }
  }
}

const mapDispatchToProps = dispatch => ({
  listAllObjects: (prefix) => dispatch(dashboardStatusActions.listAllObjects(prefix)),
  setObjectsData: objectsData =>
    dispatch(dashboardStatusActions.setObjectsData(objectsData)),
  setConfigObjects: configObjectsUnique =>
    dispatch(dashboardStatusActions.setConfigObjects(configObjectsUnique)),
  deviceFileContent: deviceFileContents =>
    dispatch(dashboardStatusActions.deviceFileContent(deviceFileContents)),
  loadedAll: loaded => dispatch(dashboardStatusActions.loadedAll(loaded))
});

const mapStateToProps = state => {
  return {
    mf4Objects: state.dashboardStatus.objectsData,
    deviceFileContents: state.dashboardStatus.deviceFileContents,
    deviceFileObjects: state.dashboardStatus.deviceFileObjects,
    configFileCrc32: state.dashboardStatus.configFileCrc32,
    serverConfig: state.browser.serverConfig,
    configFileContents: state.dashboardStatus.configFileContents,
    loaded: state.dashboardStatus.loaded
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardStatusSection);
