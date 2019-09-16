import React from "react";
import { ProgressBar } from "react-bootstrap";

import humanize from "humanize";

import AbortConfirmModal from "./AbortConfirmModal";

class ObjectTransferModal extends React.Component {
  render() {
    const {
      bytesTransfered,
      progress,
      roundOffProgress,
      progressModalText,
      isAborted,
      abortModal
    } = this.props;

    return (
      <React.Fragment>
        {isAborted ? (
          <AbortConfirmModal isAborted={isAborted} />
        ) : (
          <div className="alert alert-info progress animated fadeInUp ">
            <button type="button" className="close" onClick={abortModal}>
              <span>×</span>
            </button>
            <div className="text-center">
              <small>{progressModalText}</small>
            </div>
            <ProgressBar now={progress} />
            <div className="text-center">
              <small>
                {humanize.filesize(bytesTransfered)} ({roundOffProgress} %)
              </small>
            </div>
          </div>
        )}
      </React.Fragment>
    );
  }
}

export default ObjectTransferModal;
