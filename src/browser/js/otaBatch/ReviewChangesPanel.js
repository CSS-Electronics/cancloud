import React from "react";
import Select from "react-select";
import { ReactGhLikeDiff } from "react-gh-like-diff";

import * as cache from "./cache";
import { buildDeviceDiff, deviceOptionLabel } from "./reviewDiff";

// The same side-by-side diff as the config editor's Review-changes modal, one
// device at a time: a batch applies one partial/migration, but every device has
// its own "before", so the result has to be verifiable per device.

// hoisted: ReactGhLikeDiff is wrapped in recompose's onlyUpdateForPropTypes, so
// an inline literal here would re-run the differ on every render
const DIFF_OPTIONS = {
  originalFileName: "original_config",
  updatedFileName: "new_config",
  matchWordsThreshold: 0.25,
  matchingMaxComparisons: 5000,
  // diff2html 3.x renamed showFiles -> drawFileList and defaults it ON;
  // react-gh-like-diff still passes the v2 name, so the one-entry "Files
  // changed" bar has to be turned off here
  drawFileList: false
};

// the menu sits inside the modal's scrolling body and under its z-index:16
// overlay, so it has to be portaled out
const SELECT_STYLES = { menuPortal: (base) => ({ ...base, zIndex: 9999 }) };

class ReviewChangesPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { deviceId: null, previews: {} };
  }

  componentDidMount() {
    this.mounted = true;
    this.ensurePreview();
  }

  componentDidUpdate() {
    this.ensurePreview();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  // the selection survives a device dropping out of the batch
  activeDeviceId() {
    const { deviceIds } = this.props;
    return this.state.deviceId && deviceIds.indexOf(this.state.deviceId) > -1
      ? this.state.deviceId
      : deviceIds[0];
  }

  plan() {
    const { deviceFiles, evaluations, encryptActive } = this.props;
    const deviceId = this.activeDeviceId();
    if (!deviceId) return null;

    const evaluation = evaluations[deviceId];
    const config = cache.getConfig(deviceId);
    const mergedResult = cache.getMergedResult(deviceId);
    const needsEncryption = !!(
      encryptActive &&
      evaluation &&
      evaluation.enc &&
      evaluation.enc.hasPlain &&
      evaluation.enc.compatible
    );

    // keyed on the merged text, so a refetched config or a changed partial
    // invalidates a cached ciphertext without any token plumbing
    const key = mergedResult
      ? deviceId + "|" + cache.crc32Hex(mergedResult.mergedText)
      : null;
    const preview = key ? this.state.previews[key] : undefined;
    const failed = !!(preview && preview.status === "error");

    return {
      deviceId,
      key,
      needsEncryption,
      preview,
      diff: buildDeviceDiff({
        deviceJson: deviceFiles[deviceId],
        evaluation,
        beforeText: config ? config.text : undefined,
        mergedText: mergedResult ? mergedResult.mergedText : undefined,
        encryptedText:
          preview && preview.status === "ready" ? preview.text : undefined,
        // a failed preview falls back to the un-encrypted change plus a note
        needsEncryption: needsEncryption && !failed
      })
    };
  }

  store(key, value) {
    if (!this.mounted) return; // the modal closed mid-flight
    this.setState((state) => ({
      previews: { ...state.previews, [key]: value }
    }));
  }

  ensurePreview() {
    if (!this.props.open) return;
    const plan = this.plan();
    if (!plan || !plan.needsEncryption || !plan.key) return;
    if (this.state.previews[plan.key]) return; // also stops an error retry loop

    this.store(plan.key, { status: "loading" });
    this.props
      .buildEncryptedPreview(plan.deviceId)
      .then((text) =>
        this.store(
          plan.key,
          text
            ? { status: "ready", text }
            : { status: "error", reason: "nothing to encrypt" }
        )
      )
      .catch((e) =>
        this.store(plan.key, { status: "error", reason: e.message })
      );
  }

  renderDiff(plan) {
    const { diff, preview, needsEncryption } = plan;

    if (diff.status === "unavailable") {
      return (
        <p className="ota-diff-empty">
          The current Configuration File for this device is not loaded.
        </p>
      );
    }
    if (diff.status === "noconfig") {
      return (
        <p className="ota-diff-empty">
          No Configuration File change for this device.
        </p>
      );
    }
    if (diff.status === "pending") {
      return (
        <p className="ota-diff-empty">
          <i className="fa fa-circle-o-notch fa-spin" /> Building the encrypted
          preview ...
        </p>
      );
    }

    return (
      <div className="ota-diff-result">
        {preview && preview.status === "error" ? (
          <p className="orange-text ota-panel-note">
            <i className="fa fa-exclamation-triangle" /> Could not build the
            encrypted preview ({preview.reason}) - showing the change without
            encryption
          </p>
        ) : null}

        {diff.status === "unchanged" ? (
          <p className="ota-diff-empty">No value changes for this device.</p>
        ) : (
          <div className="ota-diff-band">
            <ReactGhLikeDiff
              options={DIFF_OPTIONS}
              past={diff.beforeDiffText}
              current={diff.afterDiffText}
            />
          </div>
        )}

        {needsEncryption && diff.status === "ready" ? (
          <p className="ota-diff-note">
            Encrypted values are a preview - every device is encrypted with a
            fresh key at submission, so the deployed ciphertext and its crc32
            will differ.
          </p>
        ) : null}
      </div>
    );
  }

  renderPicker(plan) {
    const { deviceIds, deviceFiles } = this.props;
    const index = deviceIds.indexOf(plan.deviceId);
    const step = (delta) =>
      this.setState({ deviceId: deviceIds[index + delta] });

    return (
      <div className="ota-diff-picker">
        <div className="ota-diff-select">
          <Select
            value={{
              value: plan.deviceId,
              label: deviceOptionLabel(
                plan.diff.beforeName,
                plan.deviceId,
                (deviceFiles[plan.deviceId] || {}).log_meta
              )
            }}
            options={deviceIds.map((deviceId) => ({
              value: deviceId,
              label: deviceOptionLabel(
                (deviceFiles[deviceId] || {}).cfg_name,
                deviceId,
                (deviceFiles[deviceId] || {}).log_meta
              )
            }))}
            onChange={(option) => this.setState({ deviceId: option.value })}
            menuPortalTarget={document.body}
            styles={SELECT_STYLES}
            maxMenuHeight={240}
          />
        </div>
        {deviceIds.length > 1 ? (
          <span className="ota-diff-cycle">
            <button
              type="button"
              title="Previous device"
              disabled={index <= 0}
              onClick={() => step(-1)}
            >
              <i className="fa fa-angle-left" />
            </button>
            <button
              type="button"
              title="Next device"
              disabled={index >= deviceIds.length - 1}
              onClick={() => step(1)}
            >
              <i className="fa fa-angle-right" />
            </button>
            <span className="grey-text">
              {index + 1} / {deviceIds.length}
            </span>
          </span>
        ) : null}
      </div>
    );
  }

  renderBody(plan) {
    const { deviceFiles } = this.props;
    if (!plan) return null;
    const { diff } = plan;

    return (
      <div className="ota-review-body">
        <div className="ota-diff-head">
          <div>
            <p>
              Previous Configuration File{" "}
              <span className="device-file-table">
                [crc32: {diff.beforeCrc32}]
              </span>
            </p>
            {this.renderPicker(plan)}
          </div>
          <div>
            <p>
              New Configuration File{" "}
              <span className="device-file-table">
                [crc32: {diff.afterCrc32 || "N/A"}]
              </span>
            </p>
            <div className="ota-diff-select">
              <Select
                value={{
                  value: plan.deviceId,
                  label: deviceOptionLabel(
                    diff.afterName,
                    plan.deviceId,
                    (deviceFiles[plan.deviceId] || {}).log_meta
                  )
                }}
                options={[]}
                isDisabled
                isSearchable={false}
              />
            </div>
          </div>
        </div>
        {this.renderDiff(plan)}
      </div>
    );
  }

  render() {
    const { open, onToggle } = this.props;

    return (
      <div className={"ota-review-panel" + (open ? " is-open" : "")}>
        <div className="ota-accordion-toggle" onClick={onToggle}>
          <i className={open ? "fa fa-angle-down" : "fa fa-angle-right"} />
          Review changes
        </div>
        {open ? this.renderBody(this.plan()) : null}
      </div>
    );
  }
}

export default ReviewChangesPanel;
