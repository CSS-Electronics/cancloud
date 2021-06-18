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
import InfiniteScroll from "react-infinite-scroller";
import * as actionsObjects from "./actions";
import ObjectsList from "./ObjectsList";
import CorsError from "./corsError";
import history from "../history";
import { pathSlice } from "../utils";

export class ObjectsListContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
    };
    this.loadNextPage = this.loadNextPage.bind(this);
    this.loadSessionsMeta = this.loadSessionsMeta.bind(this);
    this.loadObjectsMeta = this.loadObjectsMeta.bind(this);
  }

  loadSessionsMeta(propsInput,bucket, prefix) {
    

    let prefixList = propsInput.objects
      .slice((this.state.page - 1) * 20, this.state.page * 20)
      .filter((object) => object.name.endsWith("/"));
    this.props.fetchSessionMetaList(bucket, prefixList);
  }

  loadObjectsMeta(propsInput,bucket, prefix) {
    let objectsList = propsInput.objects.slice(
      (this.state.page - 1) * 20,
      this.state.page * 20
    );
    this.props.fetchSessionObjectsMetaList(bucket, prefix, objectsList);
  }

  componentWillReceiveProps(nextProps) {
    const { bucket, prefix } = pathSlice(history.location.pathname);

    // reset page and sessionMetaList
    if (
      this.props.currentBucket != nextProps.currentBucket ||
      bucket == "Home" ||
      this.props.currentPrefix != nextProps.currentPrefix
    ) {
      this.props.resetSessionMetaList();
      this.props.resetSessionStartTimeList();

      this.props.resetSessionObjectsMetaList();
      this.setState((state) => {
        return {
          page: 1,
        };
      });
    }

    // load sessionMetaList when in root device folder
    if (
      this.props.objects != nextProps.objects &&
      nextProps.objects.length &&
      prefix == "" &&
      bucket != ""
    ) {
      this.loadSessionsMeta(nextProps,bucket, prefix);

    }

    // load sessionObjectsMetaList when inside session folder
    if (
      this.props.objects != nextProps.objects &&
      nextProps.objects.length != 0 &&
      prefix != ""
    ) {
      this.loadObjectsMeta(nextProps,bucket, prefix);
    }
  }

  componentWillUnmount() {
    // reset page and sessionMetaList
    this.props.resetSessionMetaList();
    this.props.resetSessionStartTimeList();

    this.props.resetSessionObjectsMetaList();

    this.setState((state) => {
      return {
        page: 1,
      };
    });
  }

  loadNextPage() {

    this.setState((state) => {
      return {
        page: state.page + 1,
      };
    });

    // load next batch of sessionMetaList when in root device folder and user has scrolled to next page
    const { bucket, prefix } = pathSlice(history.location.pathname);

    if (prefix == "" && bucket != "") {
      this.loadSessionsMeta(this.props,bucket, prefix);
    }
    if (prefix != "") {
      this.loadObjectsMeta(this.props,bucket, prefix);
    }
  }


  render() {
    const {
      objects,
      isTruncated,
      currentBucket,
      loadObjects,
      err,
      sessionMetaList,
      sessionStartTimeList,
      sessionObjectsMetaList,
    } = this.props;

    const visibleObjects = objects.slice(0, this.state.page * 20);

    return (
      <div
        className="feb-container"
        style={{
          position: "relative",
        }}
      >
        <InfiniteScroll
          pageStart={0}
          loadMore={
            visibleObjects.length > 0 ? this.loadNextPage : () => {}
          }
          hasMore={objects.length > visibleObjects.length}
          useWindow={true}
          initialLoad={false}
        >
          {err == "noBucket" ? (
            <div className="text-center">
              {" "}
              <span> No Content </span>{" "}
            </div>
          ) : null}{" "}
          {err == "load" ? (
            <div className="text-center">
              {" "}
              <span> Loading... </span>{" "}
            </div>
          ) : null}{" "}
          {err != "noBucket" && err != "load" && !err ? (
            <ObjectsList
              objects={visibleObjects}
              sessionMetaList={sessionMetaList}
              sessionStartTimeList={sessionStartTimeList}
              sessionObjectsMetaList={sessionObjectsMetaList}
            />
          ) : null}{" "}
          {err != "noBucket" && err != "load" && err ? (
            <CorsError currentBucket={currentBucket} />
          ) : null}{" "}
        </InfiniteScroll>{" "}
        <div
          className="text-center"
          style={{
            display: isTruncated && currentBucket ? "block" : "none",
          }}
        >
          <span> Loading... </span>{" "}
        </div>{" "}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentBucket: state.buckets.currentBucket,
    currentPrefix: state.objects.currentPrefix,
    objects: state.objects.list,
    err: state.objects.err,
    isTruncated: state.objects.isTruncated,
    sessionMetaList: state.objects.sessionMetaList,
    sessionStartTimeList: state.objects.sessionStartTimeList,
    sessionObjectsMetaList: state.objects.sessionObjectsMetaList,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    loadObjects: (append) => dispatch(actionsObjects.fetchObjects(append)),
    fetchSessionMetaList: (bucket, prefix) =>
      dispatch(actionsObjects.fetchSessionMetaList(bucket, prefix)),
    fetchSessionObjectsMetaList: (bucket, prefix, objectsList) =>
      dispatch(
        actionsObjects.fetchSessionObjectsMetaList(bucket, prefix, objectsList)
      ),
    resetSessionMetaList: () => dispatch(actionsObjects.resetSessionMetaList()),
    resetSessionStartTimeList: () => dispatch(actionsObjects.resetSessionStartTimeList()),
    resetSessionObjectsMetaList: () =>
      dispatch(actionsObjects.resetSessionObjectsMetaList()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ObjectsListContainer);
