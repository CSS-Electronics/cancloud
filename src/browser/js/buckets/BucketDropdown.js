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

import React from "react"
import { connect } from "react-redux"
import * as actionsBuckets from "./actions"
import * as actionsBrowser from '../browser/actions'

import Dropdown from "react-bootstrap/lib/Dropdown"
import history from '../history'

export class BucketDropdown extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showBucketDropdown: false
    }
  }

  toggleDropdown() {
    if (this.state.showBucketDropdown) {
      this.setState({
        showBucketDropdown: false
      })
    } else {
      this.setState({
        showBucketDropdown: true
      })
    }
  }


  render() {
    const { bucket, selectBucket, fetchDeviceFileIfNew, openDeviceFileTable } = this.props
    return (
      <Dropdown 
        open = {this.state.showBucketDropdown}
        onToggle = {this.toggleDropdown.bind(this)}
        className="bucket-dropdown" 
        id="bucket-dropdown"
      >
        <Dropdown.Toggle noCaret>
          <i className="zmdi zmdi-more-vert"/>
        </Dropdown.Toggle>
        <Dropdown.Menu className="dropdown-menu-right">
          <li>
            <a 
              onClick={e => {
                e.stopPropagation()
                this.toggleDropdown()
                selectBucket(bucket)
                history.push(`/configuration/${bucket}`)
              }}
            >
              Configure
            </a>
          </li>
          <li>
            <a 
              onClick={e => {
                e.stopPropagation()
                this.toggleDropdown()
                selectBucket(bucket)
                fetchDeviceFileIfNew(bucket)
                openDeviceFileTable()
              }}
            >
              Device info
            </a>
          </li>
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    deleteBucket: bucket => dispatch(actionsBuckets.deleteBucket(bucket)),
    showBucketPolicy: () => dispatch(actionsBuckets.showBucketPolicy()),
    fetchDeviceFileIfNew: bucket => dispatch(actionsBrowser.fetchDeviceFileIfNew(bucket)),
    openDeviceFileTable: () => dispatch(actionsBrowser.openDeviceFileTable())
  }
}

export default connect(state => state, mapDispatchToProps)(BucketDropdown)
