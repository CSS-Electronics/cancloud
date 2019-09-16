import React from "react";
import classNames from "classnames";
import { connect } from "react-redux";
import ConfirmModal from "../browser/ConfirmModal";

import * as alertModalActions from "./actions";
import * as objectActions from "../objects/actions";

class AbortConfirmModal extends React.Component {
  abortUploads() {
    const { abort } = this.props;

    abort();
  }

  render() {
    const { hideAbort, isAborted } = this.props;
    const baseClass = classNames({
      "abort-upload": true
    });
    const okIcon = classNames({
      fa: true,
      "fa-times": true
    });
    const cancelIcon = classNames({
      fa: true,
      "fa-cloud-upload": true
    });

    const abortModalComponent = isAborted ? (
      <ConfirmModal
        show={true}
        baseClass={baseClass}
        text="Are you sure you want to abort?"
        icon="fa fa-info-circle mci-amber"
        sub="This cannot be undone!"
        okText="Abort"
        okIcon={okIcon}
        cancelText="Cancel"
        cancelIcon={cancelIcon}
        okHandler={this.abortUploads.bind(this)}
        cancelHandler={hideAbort}
      />
    ) : null;

    return abortModalComponent;
  }
}

const mapDispatchToProps = dispatch => {
  return {
    abort: () => dispatch(objectActions.handleAbortProgressModal()),
    hideAbort: () => dispatch(alertModalActions.hideAbortModal())
  };
};

export default connect(
  null,
  mapDispatchToProps
)(AbortConfirmModal);
