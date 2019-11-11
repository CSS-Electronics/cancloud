/*
 * Minio Cloud Storage (C) 2018 Minio, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react";
import { connect } from "react-redux";
import { OverlayTrigger } from "react-bootstrap";
import { getDataType } from "../mime";
import * as actions from "./actions";
import { getCheckedList } from "./selectors";
import ObjectMetaDropdown from "./ObjectMetaDropdown";
import HoverIntent from "react-hoverintent";

export class ObjectItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openDropdown: false
    };
  }

  showMetaInfo() {
    this.setState({
      openDropdown: true
    });
    let regexFileExt = new RegExp(/\b(mf4|MF4|txt|TXT|csv|json|JSON)\b/, "g");
    if (this.props.name.split(".").slice(-1)[0].match(regexFileExt)) {
      this.props.fetchState(this.props.name);
    }
  }

  hideMetaInfo() {
    this.props.resetMetaInfo();
    this.setState({
      openDropdown: false
    });
  }

  render() {
    const {
      name,
      contentType,
      size,
      lastModified,
      checked,
      checkObject,
      uncheckObject,
      actionButtons,
      onClick
    } = this.props;

    let regexFileExt = new RegExp(/\b(mf4|MF4|txt|TXT|csv|json|JSON)\b/, "g");
    const regexLogFile = new RegExp("^\\d{8}-[a-zA-Z0-9]{64}\\.mf4$", "g");
    const regexLogFileCrc = new RegExp("-[a-zA-Z0-9]{64}\\.mf4", "g");

    return (
      <HoverIntent
        onMouseOver={this.showMetaInfo.bind(this)}
        onMouseOut={this.hideMetaInfo.bind(this)}
        sensitivity={10}
        interval={500}
        timeout={250}
      >
        <div className={"fesl-row"} data-type={getDataType(name, contentType)}>
          <div className="fesl-item fesl-item-icon">
            <div className="fi-select">
              <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={() => {
                  checked ? uncheckObject(name) : checkObject(name);
                }}
              />
              <i className="fis-icon" />
              <i className="fis-helper" />
            </div>
          </div>

          <div className="fesl-item fesl-item-name">
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                if (onClick) {
                  onClick();
                }
              }}
            >
              {name.match(regexLogFile) == null
                ? name
                : name.replace(name.match(regexLogFileCrc), ".mf4")}
            </a>
          </div>
          {regexFileExt.test(name.split(".").slice(-1)[0]) ? (
            <ObjectMetaDropdown
              name={name}
              openDropdown={this.state.openDropdown}
            />
          ) : (
            ""
          )}
          <div className="fesl-item fesl-item-size">{size}</div>
          <div className="fesl-item fesl-item-modified">{lastModified}</div>
          <div className="fesl-item fesl-item-actions">{actionButtons}</div>
        </div>
      </HoverIntent>
      //name.match(regexLogFile) == null ? name : name.replace(name.match(regexLogFileCrc),".mf4")
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    checked: getCheckedList(state).indexOf(ownProps.name) >= 0
  };
};

const mapDispatchToProps = dispatch => {
  return {
    checkObject: name => dispatch(actions.checkObject(name)),
    uncheckObject: name => dispatch(actions.uncheckObject(name)),
    fetchState: name => dispatch(actions.fetchObjectStat(name)),
    resetMetaInfo: () => dispatch(actions.resetMetaInfo())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ObjectItem);
