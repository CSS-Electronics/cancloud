import React from "react";
import { connect } from "react-redux";

import ObjectDeleteModal from "./ObjectDeleteModal";
import ObjectTransferModal from "./ObjectTransferModal";

import * as alertModalActions from "./actions";
import { DELETE, DOWNLOAD } from "../constants";

class AlertModals extends React.Component {
  render() {
    const { objectQueue, userEvent, abortModal, isAborted } = this.props;

    const objectCount = Object.keys(objectQueue).length;
    if (objectCount == 0) return <noscript />;

    let queueSize = 0;
    let bytesTransfered = 0;

    Object.keys(objectQueue).forEach(key => {
      const queueObject = objectQueue[key];
      bytesTransfered += queueObject.loaded;
      queueSize += queueObject.size;
    });

    const progress = (bytesTransfered / queueSize) * 100;
    const roundOffProgress = progress.toFixed(2);

    function progressModalTextTag(stringArr, objectCountExp, objectQueueExp) {
      const modalText =
        objectCountExp == 1
          ? objectQueueExp[Object.keys(objectQueueExp)[0]].name
          : `(${objectCount})`;
      return `${stringArr[0]} ${modalText} ${stringArr[2]}`;
    }

    if (userEvent == DELETE) {
      const progressModalText = progressModalTextTag`Deleting ${objectCount} ${objectQueue} files ...`;
      return (
        <ObjectDeleteModal
          progressModalText={progressModalText}
          progress={progress}
          roundOffProgress={roundOffProgress}
        />
      );
    }

    if (userEvent == DOWNLOAD) {
      const progressModalText = progressModalTextTag`Downloading ${objectCount} ${objectQueue} files ...`;
      return (
        <ObjectTransferModal
          abortModal={abortModal}
          isAborted={isAborted}
          bytesTransfered={bytesTransfered}
          progressModalText={progressModalText}
          progress={progress}
          roundOffProgress={roundOffProgress}
        />
      );
    }
  }
}

const mapStateToProps = state => {
  return {
    objectQueue: state.alertModals.files,
    userEvent: state.alertModals.modal,
    isAborted: state.alertModals.showAbortModal
  };
};

const mapDispatchToProps = dispatch => {
  return {
    abortModal: () => dispatch(alertModalActions.showAbortModal())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AlertModals);
