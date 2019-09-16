/**
 * CANcloud cloud storage browser
 * Progress Modal for Delete objects from the cloud storage
 */

import React from "react";
import { ProgressBar } from "react-bootstrap";

class ObjectDeleteModal extends React.Component {
  render() {
    const { progress, roundOffProgress, progressModalText } = this.props;

    return (
      <div className="alert alert-info progress animated fadeInUp ">
        <div className="text-center">
          <small>{progressModalText}</small>
        </div>
        <ProgressBar now={progress} />
        <div className="text-center">
          <small>{roundOffProgress} %</small>
        </div>
      </div>
    );
  }
}

export default ObjectDeleteModal;
