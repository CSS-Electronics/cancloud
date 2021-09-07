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
import { isValidCanedgefile } from "../utils";
import classNames from "classnames";

export class ObjectItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openDropdown: false,
    };
  }

  showMetaInfo() {
    this.setState({
      openDropdown: true,
    });

    if (isValidCanedgefile(this.props.name.split(".").slice(-1)[0])) {
      this.props.fetchState(this.props.name);
    }
  }

  hideMetaInfo() {
    this.props.resetMetaInfo();
    this.setState({
      openDropdown: false,
    });
  }

  render() {
    const { name, contentType, size, totalCount, lastModified, checked, checkObject, uncheckObject, actionButtons, onClick, startTime } = this.props;

    let regexFileExt = new RegExp(/\b(mf4|MF4|MFE|MFC|MFM|txt|TXT|csv|json|JSON)\b/, "g");
    const regexLogFile0007 = new RegExp("^\\d{8}-[a-zA-Z0-9]{64}\\.mf4$", "g");
    const regexLogFile0007Crc = new RegExp("-[a-zA-Z0-9]{64}", "g");
    const regexLogFile0102 = new RegExp("^\\d{8}-[a-zA-Z0-9]{8}\\.(MF4|MFM|MFE|MFC)$", "g");
    const regexLogFile0102Epoch = new RegExp("-[a-zA-Z0-9]{8}", "g");

    return (
      <HoverIntent onMouseOver={this.showMetaInfo.bind(this)} onMouseOut={this.hideMetaInfo.bind(this)} sensitivity={10} interval={500} timeout={250}>
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
              onClick={(e) => {
                e.preventDefault();
                if (onClick) {
                  onClick();
                }
              }}
            >
              {name.match(regexLogFile0007)
                ? name.replace(name.match(regexLogFile0007Crc), "")
                : name.match(regexLogFile0102)
                ? name.replace(name.match(regexLogFile0102Epoch), "")
                : name}
            </a>
          </div>
          {regexFileExt.test(name.split(".").slice(-1)[0]) ? <ObjectMetaDropdown name={name} openDropdown={this.state.openDropdown} /> : ""}

          <div className={classNames({ "fesl-item fesl-item-size": true, "range-item": name.endsWith("/") })}>{size}</div>
          <div className={classNames({ "fesl-item fesl-item-count": true, "range-item": name.endsWith("/") })}>{totalCount}</div>
          <div className={classNames({ "fesl-item fesl-item-modified": true, "range-item": name.endsWith("/") })}>{startTime}</div>
          <div className={classNames({ "fesl-item fesl-item-modified": true, "range-item": name.endsWith("/") })}>{lastModified}</div>
          <div className="fesl-item fesl-item-actions">{actionButtons}</div>
        </div>
      </HoverIntent>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    checked: getCheckedList(state).indexOf(ownProps.name) >= 0,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    checkObject: (name) => dispatch(actions.checkObject(name)),
    uncheckObject: (name) => dispatch(actions.uncheckObject(name)),
    fetchState: (name) => dispatch(actions.fetchObjectStat(name)),
    resetMetaInfo: () => dispatch(actions.resetMetaInfo()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ObjectItem);
