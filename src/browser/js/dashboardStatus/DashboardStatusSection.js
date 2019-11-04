import React from "react";
import { connect } from "react-redux";
import * as dashboardStatusActions from "./actions";
import * as browserActions from "../browser/actions";
import { defaults } from "react-chartjs-2";
import { Bar, Doughnut } from "react-chartjs-2";
import Moment from "moment";
import { prepareData, barOptionsFunc } from "./prepareData";
import {
  prepareDataDevices,
  pieOptionsFunc,
  pieMultiOptionsFunc
} from "./prepareDataDevices";

import DeviceTable from "./DeviceTable";

// https://stackoverflow.com/questions/42394429/aws-sdk-s3-best-way-to-list-all-keys-with-listobjectsv2

const statusConfig = require(`../../schema/status-config-03.01.json`);
const resWide = window.innerWidth > 2000 ? 1 : 0;

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
      periodHours: 24 * 7
    };
  }

  handleChange(event) {
    this.setState({
      periodHours: event.target.value
    });
  }

  componentDidMount() {
    if (Object.keys(this.props.serverConfig).length) {
      this.props.listAllObjects(); // if dashboard is loaded after the serverConfig has been added to state
    } else {
      // in this case the listAllObjects will be called by the fetchServerConfig action
    }
  }

  componentWillUnmount() {
    this.props.clearData();
  }

  render() {
    const {
      mf4Objects,
      deviceFileContents,
      deviceFileObjects,
      configFileCrc32,
      serverConfig,
      loadedFiles,
      loadedDevice,
      loadedConfig
    } = this.props;

    // console.log("==========================")
    // console.log(loadedFiles)
    // console.log(loadedConfig)
    // console.log(loadedDevice)
    // console.log(mf4Objects)
    // console.log(deviceFileObjects)


    const { periodHours } = this.state;
    const loadedDeviceData = deviceFileObjects.length && deviceFileContents.length
    let chartDataDevices = [];
    let chartDataDevicesArray = []
    let chartDataDevicesReady = 0
    let chartData = [];


    if (!loadedDevice && !loadedConfig) {
      return (
        <div className="feb-container dashboard">
          <p className="loading-dots">Loading data</p>
          <p className="loading-delay">(this may take a while)</p>
        </div>
      );
    }

    if (loadedDevice && loadedConfig && loadedDevice && mf4Objects.length == 0 && deviceFileObjects.length == 0) {
      return (
        <div className="feb-container dashboard">
          <p className="loading-delay">No data to display</p>
        </div>
      );
    }

    if (loadedDevice && loadedConfig) {
      
      if(loadedDeviceData){
      chartDataDevicesArray = prepareDataDevices(
        periodHours,
        deviceFileObjects,
        deviceFileContents,
        configFileCrc32
      );
    

      chartDataDevices = chartDataDevicesArray[0];
      chartDataDevicesReady = Object.values(chartDataDevicesArray[0])
        .length;

      }

      let chartDataArray = prepareData(
        periodHours,
        mf4Objects,
        deviceFileObjects
      );



      chartData = chartDataArray[0];

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
                  {(loadedFiles && widget.dependency == "files") ||
                  (loadedConfig &&
                    loadedDevice &&
                    widget.dependency == "devices") ? (
                    <div>
                      {widget.widget_type == "kpi" ? (
                        <div
                          className="widget-kpi"
                          style={{ color: chColors[0] }}
                        >
                          {widget.dependency == "files"
                            ? chartData[widget.dataset]
                            : chartDataDevices[widget.dataset]}
                        </div>
                      ) : null}

                      {widget.widget_type == "pie" && chartDataDevicesReady ? (
                        <Doughnut
                          data={chartDataDevices[widget.dataset]}
                          height={widget.height - 60 + (resWide ? 100 : 0)}
                          options={
                            widget.dataset == "deviceConfigFW"
                              ? pieMultiOptions
                              : pieOptions
                          }
                        />
                      ) : null}

                      {widget.widget_type == "bar" ? (
                        <Bar
                          data={
                            widget.dependency == "files"
                              ? chartData[widget.dataset]
                              : chartDataDevices[widget.dataset]
                          }
                          height={widget.height - 60 + (resWide ? 100 : 0)}
                          options={barOptions}
                        />
                      ) : null}

                      {widget.widget_type == "table" &&
                      deviceFileContents.length ? (
                        <div
                          style={{
                            height: widget.height + (resWide ? 100 : 0)
                          }}
                        >
                          <DeviceTable
                            deviceIdListDeltaSort={chartDataDevicesArray[1]}
                            deviceFileContents={deviceFileContents}
                            configFileCrc32={configFileCrc32}
                            serverConfig={serverConfig}
                            mf4ObjectsFiltered={chartDataArray[2]}
                            deviceCrc32Test={chartDataDevicesArray[2]}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="loading-dots">Loading data</p>
                  )}{" "}
                  <div style={{ marginTop: 5 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      return <div className="feb-container dashboard"></div>;
    }
  }
}

const mapDispatchToProps = dispatch => ({
  listAllObjects: prefix =>
    dispatch(dashboardStatusActions.listAllObjects(prefix)),
  setObjectsData: objectsData =>
    dispatch(dashboardStatusActions.setObjectsData(objectsData)),
  setConfigObjects: configObjectsUnique =>
    dispatch(dashboardStatusActions.setConfigObjects(configObjectsUnique)),
  setDeviceFileContent: deviceFileContents =>
    dispatch(dashboardStatusActions.deviceFileContent(deviceFileContents)),
    setDeviceFileObjects: deviceFileObjects =>
    dispatch(dashboardStatusActions.setDeviceFileObjects(deviceFileObjects)),
  loadedFilesSet: loadedFiles =>
    dispatch(dashboardStatusActions.loadedFiles(loadedFiles)),
  loadedConfigSet: loadedConfig =>
    dispatch(dashboardStatusActions.loadedConfig(loadedConfig)),
  loadedDeviceSet: loadedDevice =>
    dispatch(dashboardStatusActions.loadedDevice(loadedDevice)),
  fetchServerObjectList: () => dispatch(browserActions.fetchServerObjectList())
  ,
  clearData: () => dispatch(dashboardStatusActions.clearData())
});

const mapStateToProps = state => {
  return {
    mf4Objects: state.dashboardStatus.mf4Objects,
    deviceFileContents: state.dashboardStatus.deviceFileContents,
    deviceFileObjects: state.dashboardStatus.deviceFileObjects,
    configFileCrc32: state.dashboardStatus.configFileCrc32,
    serverConfig: state.browser.serverConfig,
    configFileContents: state.dashboardStatus.configFileContents,
    loadedFiles: state.dashboardStatus.loadedFiles,
    loadedDevice: state.dashboardStatus.loadedDevice,
    loadedConfig: state.dashboardStatus.loadedConfig
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardStatusSection);
