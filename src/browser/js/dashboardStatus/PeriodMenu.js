import React from "react";

class PeriodMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="dashboard-control-container">
        <form>
          <label className="period-hours-selector">
            <input
              type="radio"
              name="radios"
              id="radio1"
              value={24 * 30}
              checked={this.props.periodHours == 24 * 30}
              onChange={this.props.handleChange}
              visibility="hidden"
            />
            <label htmlFor="radio1" className="noselect">
              &nbsp;monthly&nbsp;
            </label>
          </label>
          <label className="period-hours-selector">
            <input
              type="radio"
              name="radios"
              id="radio2"
              value={24 * 7}
              checked={this.props.periodHours == 24 * 7}
              onChange={this.props.handleChange}
            />
            <label htmlFor="radio2" className="noselect">
              &nbsp;weekly&nbsp;
            </label>
          </label>
          <label className="period-hours-selector">
            <input
              type="radio"
              name="radios"
              id="radio3"
              value={24}
              checked={this.props.periodHours == 24}
              onChange={this.props.handleChange}
            />
            <label htmlFor="radio3" className="noselect">
              &nbsp;daily&nbsp;
            </label>
          </label>
          <label className="period-hours-selector">
            <input
              type="radio"
              name="radios"
              id="radio4"
              value={1}
              checked={this.props.periodHours == 1}
              onChange={this.props.handleChange}
            />
            <label htmlFor="radio4" className="noselect">
              &nbsp;hourly&nbsp;
            </label>
          </label>
        </form>
      </div>
    );
  }
}

export default PeriodMenu;
