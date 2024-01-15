import React from "react";
import { connect } from "react-redux";
import * as dashboardStatusActions from "./actions";
import { defaults } from "react-chartjs-2";
import { Bar, Doughnut, HorizontalBar } from "react-chartjs-2";
import ReactMultiSelectCheckboxes from "react-multiselect-checkboxes";
import {
  prepareData,
  barOptionsFunc,
  customCheckboxStyles,
  devicesOptionsFn,
  selectedListFn
} from "./prepareData";
import {
  prepareDataDevices,
  pieOptionsFunc,
  horizontalBarOptionsFunc,
  pieMultiOptionsFunc
} from "./prepareDataDevices";
import DeviceTable from "./DeviceTable";
import PeriodMenu from "./PeriodMenu";

const resWide = window.innerWidth > 2000 ? 2 : window.innerWidth > 1800 ? 1 : 0;
const statusConfig = require(`../../schema/status-config-03.01.json`);
const confDash = statusConfig.dashboard;
const chDefaults = confDash.default_settings;
const chColors = chDefaults.chart_colors.split(" ");
const wgt = confDash.widgets;
let tableHeight = (window.innerHeight - (window.innerHeight < 1100 ? 450 : 750) + (window.innerWidth < 800 ? 200 : 0))

defaults.global.elements.line.borderWidth = chDefaults.line_border_width;
defaults.global.elements.point.radius = chDefaults.point_radius;
defaults.global.defaultFontSize = resWide ? 12 : chDefaults.chart_font_size;
defaults.global.legend.labels.boxWidth = chDefaults.legend_labels_box_width;
defaults.global.legend.labels.padding = chDefaults.legend_labels_padding;
defaults.global.animation.duration = 500;

class DashboardStatusSection extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleChangeDevices = this.handleChangeDevices.bind(this);
    this.handleChangeFiles = this.handleChangeFiles.bind(this);

    this.state = {
      periodHours: 24 * 7,
      devicesDevicesInput: [],
      devicesFilesInput: []
    };
  }

  handleChange(event) {
    if (event.target.value == 24 * 30) {
      this.props.clearDataFiles();
      this.props.setPeriodStartBack(30);
      this.props.listLogFiles(this.state.devicesFilesInput.map(e => e.value));
    }

    this.setState({
      periodHours: event.target.value
    });
  }

  handleChangeDevices(event) {
    let selectedList = selectedListFn(event, this.props.deviceList);

    this.setState({
      devicesDevicesInput: selectedList
    });
  }

  handleChangeFiles(event) {
    let selectedList = selectedListFn(event, this.props.deviceList);

    this.setState({
      devicesFilesInput: selectedList
    });
  }

  updateDevicesDevices(e) {
    this.setState({}, () => {
      this.props.clearDataDevices();
      this.props.listAllObjects(
        this.state.devicesDevicesInput.map(e => e.value)
      );
    });
  }

  updateDevicesFiles(e) {
    this.setState({}, () => {
      this.props.clearDataFiles();
      this.props.listLogFiles(this.state.devicesFilesInput.map(e => e.value));
    });
  }

  componentWillUnmount() {
    this.props.clearDataDevices();
    this.props.clearDataFiles();
    this.props.setPeriodStartBack(7);
  }

  render() {
    const {
      mf4Objects,
      mf4ObjectsMin,
      deviceFileContents,
      deviceFileObjects,
      configFileCrc32,
      loadedFiles,
      loadedDevice,
      loadedConfig,
      deviceList,
      devicesFilesCount,
      deviceLastMf4MetaData
    } = this.props;

    const { periodHours, devicesDevicesInput, devicesFilesInput } = this.state;
    const devicesOptions = devicesOptionsFn(deviceList);

    const loadedDeviceData =
      deviceFileObjects && deviceFileContents
        ? deviceFileObjects.length && deviceFileContents.length
        : 0;
    let chartDataDevices = [];
    let chartDataDevicesArray = [];
    let chartDataDevicesReady = 0;
    let chartDataReady = 0;
    let chartData = [];
    let chartDataArray = [];
    let barOptions = {};

    if (loadedFiles) {
      chartDataArray = prepareData(
        periodHours,
        mf4Objects,
        mf4ObjectsMin,
        devicesFilesCount
      );

      chartData = chartDataArray[0];

      chartDataReady = Object.values(chartData).length;

      barOptions = barOptionsFunc(this.state.periodHours, chartDataArray[1]);
    }

    if (loadedDevice && loadedConfig) {
      if (loadedDeviceData) {
        chartDataDevicesArray = prepareDataDevices(
          periodHours,
          deviceFileObjects,
          deviceFileContents,
          configFileCrc32
        );

        chartDataDevices = chartDataDevicesArray[0];
        chartDataDevicesReady = Object.values(chartDataDevicesArray[0]).length;
      }
    }

    return (
      <div>
        <div className="dashboard-block" />
        <div className="multi-check-form">
          <div className="period-hours-form">
            <PeriodMenu
              periodHours={this.state.periodHours}
              handleChange={this.handleChange}
            />
          </div>

          <div className="dashboard-control-container">
            <div
              className="field-string"
              style={{ float: "right", textAlign: "left" }}
            >
              <div className="check-box-container">
                <i className="widget-icon-logs" />
                &nbsp;
                <span className="devices-list">log files: </span>&nbsp;
              </div>{" "}
              <div className="check-box-container multi-select">
                <ReactMultiSelectCheckboxes
                  value={devicesFilesInput}
                  options={devicesOptions}
                  onChange={this.handleChangeFiles}
                  styles={customCheckboxStyles}
                />
              </div>
              <p className="field-description field-description-shift">
                The log file specific dashboard widgets (e.g. size metrics) are
                based on this list of devices. By default, data for all devices
                will be loaded when the server has 3 or fewer devices connected.
                If more devices are connected, the log file specific metrics are
                not shown by default.
              </p>
              &nbsp; &nbsp;
              <button
                type="button"
                id="files-btn"
                onClick={this.updateDevicesFiles.bind(this)}
                className="btn btn-small"
              >
                {" "}
                update{" "}
              </button>
              &nbsp; &nbsp;
            </div>

            <div
              className="field-string"
              style={{ float: "right", textAlign: "left" }}
            >
              <div className="check-box-container">
                <i className="widget-icon-device" />
                &nbsp;
                <span className="devices-list">devices: </span> &nbsp;
              </div>
              <div className="check-box-container multi-select">
                <ReactMultiSelectCheckboxes
                  value={devicesDevicesInput}
                  options={devicesOptions}
                  onChange={this.handleChangeDevices}
                  styles={customCheckboxStyles}
                />
              </div>
              &nbsp; &nbsp;
              <p className="field-description field-description-shift">
                The device-specific dashboard widgets (e.g. heartbeat metrics)
                are based on this list of devices. By default all devices are
                loaded (but metrics are only shown for those that have checked
                in within the period selected).
              </p>
              <button
                type="button"
                id="devices-btn"
                onClick={this.updateDevicesDevices.bind(this)}
                className="btn btn-small"
              >
                {" "}
                update{" "}
              </button>
              &nbsp; &nbsp;
            </div>
          </div>
        </div>

        <div className="feb-container dashboard">
          {mf4Objects.length == 0 && deviceFileObjects.length == 0 ? (
            <div>
              {" "}
              <br />
              <br />
              <p className="loading-delay">No data to display</p>
            </div>
          ) : (
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
                        (widget.widget_type != "kpi" && resWide ? 100 : 0) +
                        (widget.widget_type == "table" ? tableHeight : 0)
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        bottom: "5px",
                        right: "10px"
                      }}
                    >
                      <i
                        className={
                          widget.dependency == "devices"
                            ? "widget-icon-device"
                            : "widget-icon-logs"
                        }
                      />
                    </div>
                    <div className="field-string">
                      <span className="widget-title">
                        {widget.title ? widget.title : null}
                        {widget.dataset == "dataUploadTime" ? (
                          periodHours == 24 * 30 ? (
                            <span>(MB/day)</span>
                          ) : periodHours == 24 * 7 || periodHours == 24 ? (
                            <span>(MB/hour)</span>
                          ) : (
                            <span>(MB/minute)</span>
                          )
                        ) : null}
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

                        {widget.widget_type == "pie" &&
                        chartData[widget.dataset] &&
                        chartData[widget.dataset].datasets[0].data.reduce(
                          (a, b) => a + b,
                          0
                        ) &&
                        widget.dependency == "files" ? (
                          <Doughnut
                            data={chartData[widget.dataset]}
                            height={widget.height - 60 + (resWide ? 100 : 0)}
                            options={pieOptionsFunc()}
                          />
                        ) : null}

                        {widget.widget_type == "pie" &&
                        chartDataDevicesReady &&
                        widget.dependency == "devices" ? (
                          <Doughnut
                            data={chartDataDevices[widget.dataset]}
                            height={widget.height - 60 + (resWide ? 100 : 0)}
                            options={
                              widget.dataset == "deviceConfigFW"
                                ? pieMultiOptionsFunc()
                                : pieOptionsFunc()
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

                      {widget.widget_type == "horizontal-bar" && chartDataDevices[widget.dataset] ? (
                          <HorizontalBar
                            data={chartDataDevices[widget.dataset]}
                            height={widget.height - 60 + (resWide ? 100 : 0)}
                            options={horizontalBarOptionsFunc(chartDataDevices.kpiConnected)}
                          />
                        ) : null}

                        {widget.widget_type == "table" &&
                        deviceFileContents.length ? (
                          <DeviceTable
                            deviceIdListDeltaSort={chartDataDevicesArray[1]}
                            deviceFileContents={deviceFileContents}
                            configFileCrc32={configFileCrc32}
                            mf4ObjectsFiltered={
                              chartDataArray[2] ? chartDataArray[2] : []
                            }
                            deviceCrc32Test={chartDataDevicesArray[2]}
                            height={tableHeight}
                            deviceLastMf4MetaData={deviceLastMf4MetaData}
                          />
                        ) : null}
                      </div>
                    ) : !loadedFiles ? (
                      <div>
                        <p className="loading-delay">
                          <span className="loading-dots">Loading data</span>
                          <br />({devicesFilesCount}{" "}
                          devices)
                        </p>
                      </div>
                    ) : null}{" "}
                    <div style={{ marginTop: 5 }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  listAllObjects: prefix =>
    dispatch(dashboardStatusActions.listAllObjects(prefix)),
  listLogFiles: devicesFilesInput =>
    dispatch(dashboardStatusActions.listLogFiles(devicesFilesInput)),
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
  clearDataDevices: () => dispatch(dashboardStatusActions.clearDataDevices()),
  clearDataFiles: () => dispatch(dashboardStatusActions.clearDataFiles()),
  setPeriodStartBack: periodDelta =>
    dispatch(dashboardStatusActions.setPeriodStartBack(periodDelta)),
});

const mapStateToProps = state => {
  return {
    mf4Objects: state.dashboardStatus.mf4Objects,
    mf4ObjectsMin: state.dashboardStatus.mf4ObjectsMin,
    deviceFileContents: state.dashboardStatus.deviceFileContents,
    deviceFileObjects: state.dashboardStatus.deviceFileObjects,
    configFileCrc32: state.dashboardStatus.configFileCrc32,
    configFileContents: state.dashboardStatus.configFileContents,
    loadedFiles: state.dashboardStatus.loadedFiles,
    loadedDevice: state.dashboardStatus.loadedDevice,
    loadedConfig: state.dashboardStatus.loadedConfig,
    devicesFilesCount: state.dashboardStatus.devicesFilesCount,
    deviceList: state.buckets.bucketsMeta,
    deviceLastMf4MetaData: state.dashboardStatus.deviceLastMf4MetaData
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardStatusSection);
