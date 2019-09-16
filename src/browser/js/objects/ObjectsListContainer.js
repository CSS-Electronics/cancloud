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
import classNames from "classnames";
import { connect } from "react-redux";
import InfiniteScroll from "react-infinite-scroller";
import * as actionsObjects from "./actions";
import ObjectsList from "./ObjectsList";
import CorsError from "./corsError";

export class ObjectsListContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 1
    };
    this.loadNextPage = this.loadNextPage.bind(this);
  }

  loadNextPage() {
    this.setState(state => {
      return { page: state.page + 1 };
    });
  }

  render() {
    const {
      objects,
      isTruncated,
      currentBucket,
      loadObjects,
      err
    } = this.props;

    const visibleObjects = objects.slice(0, this.state.page * 100);
    return (
      <div className="feb-container" style={{ position: "relative" }}>
        <InfiniteScroll
          pageStart={0}
          loadMore={this.loadNextPage}
          hasMore={objects.length > visibleObjects.length}
          useWindow={true}
          initialLoad={false}
        >
          {err == "noBucket" ? (
            <div className="text-center">
              {" "}
              <span>No Content</span>
            </div>
          ) : null}
          {err == "load" ? (
            <div className="text-center">
              {" "}
              <span>Loading...</span>
            </div>
          ) : null}
          {err != "noBucket" && err != "load" && !err ? (
            <ObjectsList objects={visibleObjects} />
          ) : null}
          {err != "noBucket" && err != "load" && err ? (
            <CorsError currentBucket={currentBucket} />
          ) : null}
        </InfiniteScroll>
        <div
          className="text-center"
          style={{ display: isTruncated && currentBucket ? "block" : "none" }}
        >
          <span>Loading...</span>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    currentBucket: state.buckets.currentBucket,
    currentPrefix: state.objects.currentPrefix,
    objects: state.objects.list,
    err: state.objects.err,
    isTruncated: state.objects.isTruncated
  };
};

const mapDispatchToProps = dispatch => {
  return {
    loadObjects: append => dispatch(actionsObjects.fetchObjects(append))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ObjectsListContainer);
