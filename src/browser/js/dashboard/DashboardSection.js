import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as dashboardActions from "./actions";
import { BaseChart, BaseMap, BaseTable } from "../charts";
import { defaults } from "react-chartjs-2";

let confDash = null;
let chDefaults = null;
let wgt = null;
let chColors = [];

class DashboardSection extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps){
    const { serverConfig } = nextProps;

    // upon load of serverConfig, set chart defaults & prepare widget data
    if (this.props.serverConfig != nextProps.serverConfig && Object.keys(serverConfig).length > 0) {
      confDash = serverConfig.dashboard;
      chDefaults = confDash.default_settings;
      chColors = chDefaults.chart_colors.split(" ");
      wgt = confDash.widgets;

      defaults.global.elements.line.borderWidth = chDefaults.line_border_width;
      defaults.global.elements.point.radius = chDefaults.point_radius;
      defaults.global.defaultFontSize = chDefaults.chart_font_size;
      defaults.global.legend.labels.boxWidth = chDefaults.legend_labels_box_width;
      defaults.global.legend.labels.padding = chDefaults.legend_labels_padding;

      this.props.prepareWidgetInputs(serverConfig.dashboard);

    }
  }

  render() {
   
    const {recordsArray, serverConfig} = this.props;

    return (
      <div className="feb-container dashboard">
        {confDash != null && recordsArray.length != 0 ? (
          <div>
            {recordsArray.map((records, i) => (
              <div
                key={"widget " + i}
                className={
                  "zero-padding " +
                  (wgt[i].class_name ? wgt[i].class_name : "col-sm-4")
                }
              >
                <div
                  className="dashboard-widget"
                  style={{ height: wgt[i].height }}
                >
                  <span className="widget-title">
                    {wgt[i].title ? wgt[i].title : null}
                  </span>

                  <div style={{ marginTop: 5 }}>
                    {!["kpi", "map", "table"].includes(wgt[i].widget_type) ? (
                      <BaseChart
                        chartType={wgt[i].widget_type}
                        chColors={
                          wgt[i].colors ? wgt[i].colors.split(" ") : chColors
                        }
                        aspectRatio={wgt[i].aspect_ratio}
                        chHeight={wgt[i].height - 60}
                        datasets={
                          records.records ? records.records.dataset : null
                        }
                      />
                    ) : ["kpi", "table"].includes(wgt[i].widget_type) ? (
                      <BaseTable
                        chartType={wgt[i].widget_type}
                        chColors={
                          wgt[i].colors ? wgt[i].colors.split(" ") : chColors
                        }
                        chHeight={wgt[i].height - 50}
                        fontSize={chDefaults.table_font_size}
                        datasets={
                          records.records ? records.records.dataset : null
                        }
                      />
                    ) : (
                      <BaseMap
                        chColors={
                          wgt[i].colors ? wgt[i].colors.split(" ") : chColors
                        }
                        chHeight={wgt[i].height - 50}
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
