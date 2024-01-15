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
import InfiniteScroll from "react-infinite-scroll-component";
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
      timeoutId: null,
      pageCounterList: []
    };
    this.loadNextPage = this.loadNextPage.bind(this);
    this.loadSessionsMeta = this.loadSessionsMeta.bind(this);
    this.loadObjectsMeta = this.loadObjectsMeta.bind(this);
    this.loadMetaDataBasedOnScroll = this.loadMetaDataBasedOnScroll.bind(this);
    window.addEventListener('scroll', this.loadMetaDataBasedOnScroll, true);
  }

  loadSessionsMeta(propsInput, bucket, prefix, pageCounter) {
    let prefixList = propsInput.objects.slice((pageCounter - 1) * 20, pageCounter * 20).filter((object) => object.name.endsWith("/"));
    this.props.fetchSessionMetaList(bucket, prefixList);
  }

  loadObjectsMeta(propsInput, bucket, prefix, pageCounter) {
    let objectsList = propsInput.objects.slice((pageCounter - 1) * 20, pageCounter * 20);
    this.props.fetchSessionObjectsMetaList(bucket, prefix, objectsList);
  }

  componentWillReceiveProps(nextProps) {
    const { bucket, prefix } = pathSlice(history.location.pathname);

    // reset page and sessionMetaList
    if (this.props.currentBucket != nextProps.currentBucket || bucket == "Home" || this.props.currentPrefix != nextProps.currentPrefix) {
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
    if (this.props.objects != nextProps.objects && nextProps.objects.length && prefix == "" && bucket != "") {
      this.loadSessionsMeta(nextProps, bucket, prefix, 1);
    }

    // load sessionObjectsMetaList when inside session folder
    if (this.props.objects != nextProps.objects && nextProps.objects.length != 0 && prefix != "") {
      this.loadObjectsMeta(nextProps, bucket, prefix, 1);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.loadMetaDataBasedOnScroll, true);
    // reset page and sessionMetaList
    this.props.resetSessionMetaList();
    this.props.resetSessionStartTimeList();

    this.props.resetSessionObjectsMetaList();
    this.props.resetObjectsS3MetaStart();

    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId);
    }

    this.setState((state) => {
      return {
        page: 1,
        pageCounterList: [],
        timeoutId: null
      };
    });
  }

  loadNextPage() {
    this.setState((state) => {
      return {
        page: state.page + 1
      };
    });
  }

  loadMetaDataBasedOnScroll() {

    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId);
    }
    this.setState({
      timeoutId: setTimeout(() => {

        // define pageCounter based
        let pageCounter = Math.ceil((document.documentElement.scrollTop) / 1040)

        // load next batch of sessionMetaList when in root device folder and user has scrolled to next page
        if (this.state.pageCounterList && this.state.pageCounterList.includes(pageCounter) == false) {
          const { bucket, prefix } = pathSlice(history.location.pathname);
          if (prefix == "" && bucket != "") {
            this.loadSessionsMeta(this.props, bucket, prefix, pageCounter);
          }
          if (prefix != "") {
            this.loadObjectsMeta(this.props, bucket, prefix, pageCounter);
          }
          this.setState((prevState) => {
            return {
              pageCounterList: [...prevState.pageCounterList, pageCounter],
            };
          });
        }

      }, 500)
    })



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
      objectsS3MetaStart,
    } = this.props;

    // Load JSON objects separately to ensure they are always included at the top when existing
    let jsonObjects = objects.filter((object) => object.name.endsWith(".json"))
    let visibleObjects = objects.slice(0, this.state.page * 50);

    visibleObjects = Array.from(new Set(jsonObjects.concat(visibleObjects) ));
    return (
      <div
        className="feb-container"
        onScroll={this.loadSessionDataBasedOnScroll}
        style={{
          position: "relative",
        }}
      >
        <InfiniteScroll
          pageStart={0}
          dataLength={visibleObjects.length}
          children={objects}
          next={visibleObjects.length > 0 ? this.loadNextPage : () => { }}
          hasMore={visibleObjects.length < objects.length}
          loader={<h4>Loading...</h4>}
          // useWindow={true}
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
              objectsS3MetaStart={objectsS3MetaStart}
            />
          ) : null}{" "}
          {err != "noBucket" && err != "load" && err ? <CorsError currentBucket={currentBucket} /> : null}{" "}
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
    objectsS3MetaStart: state.objects.objectsS3MetaStart,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    loadObjects: (append) => dispatch(actionsObjects.fetchObjects(append)),
    fetchSessionMetaList: (bucket, prefix) => dispatch(actionsObjects.fetchSessionMetaList(bucket, prefix)),
    fetchSessionObjectsMetaList: (bucket, prefix, objectsList) => dispatch(actionsObjects.fetchSessionObjectsMetaList(bucket, prefix, objectsList)),
    resetSessionMetaList: () => dispatch(actionsObjects.resetSessionMetaList()),
    resetSessionStartTimeList: () => dispatch(actionsObjects.resetSessionStartTimeList()),
    resetSessionObjectsMetaList: () => dispatch(actionsObjects.resetSessionObjectsMetaList()),
    resetObjectsS3MetaStart: () => dispatch(actionsObjects.resetObjectsS3MetaStart()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ObjectsListContainer);
