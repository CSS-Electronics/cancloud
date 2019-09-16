import React from "react";
import { connect } from "react-redux";
import Select from "react-select";
import OutputField from "./OutputField";
import InputField from "./InputField";
import * as actionsEncryption from "./actions";
import * as actionsAlert from "../alert/actions";

const options = [
  { value: "new", label: "Generate new encryption key" },
  { value: "existing", label: "Use existing encryption key" }
];

class EncryptionModal extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.state = {
      selectedOption: options[0]
    };
  }

  componentWillUnmount() {
    this.props.resetAllKeys();
  }

  handleChange = selectedOption => {
    this.setState(
      {
        selectedOption
      },
      () => {
        this.props.resetAllKeys();
      }
    );
  };

  closeModal(e) {
    this.setState({}, () => {
      this.props.toggleEncryptionSideBar();
      this.props.resetAllKeys();
    });
  }

  render() {
    const { selectedOption } = this.state;
    return (
      <div className="tools-side-bar">
        <button type="button" className="close" onClick={this.closeModal}>
          <span style={{ color: "gray" }}>×</span>
        </button>

        <h4>Encryption tool</h4>
        <div className="form-group pl0 field-string">
          <p>Mode</p>
          <Select
            value={selectedOption}
            options={options}
            onChange={this.handleChange}
            isSearchable={false}
          />{" "}
          <p className="field-description field-description-shift">
            If you need to encrypt your plain text field data from scratch, you
            can generate a new server public key and encryption key using your
            device public key. If you've done this before, you can alternatively
            re-use your encryption key to avoid having to encrypt all your plain
            text data again.
          </p>
        </div>

        {this.state.selectedOption &&
        this.state.selectedOption.value == "new" ? (
          <InputField
            headerText="Device public key"
            id="devicePublicKeyBase64"
            buttonText="Create keys"
            buttonClick={this.props.importDevicePublicKey}
            comment="Insert the device public key from your device.json file. The
          tool then generates a server secret/public key
          and an encryption key."
          />
        ) : (
          <div />
        )}

        {this.state.selectedOption &&
        this.state.selectedOption.value == "existing" ? (
          <InputField
            headerText="Encryption key"
            id="symmetricKeyBase64"
            buttonText="Load key"
            buttonClick={this.props.importSymmetricKey}
            comment="Load a previously generated encryption key to enable the encryption of additional plain text field values. The device will use the related server public key to decrypt the data, allowing you to avoid re-encrypting all plain text fields from scratch."
          />
        ) : (
          <div />
        )}

        {this.state.selectedOption &&
        this.state.selectedOption.value == "new" &&
        this.props.serverPublicKeyBase64 != "" ? (
          <div>
            <OutputField
              headerText="Server public key"
              id="serverPublicKeyBase64"
              masked={false}
              alertMsg={this.props.showAlert}
              rows="4"
              value={this.props.serverPublicKeyBase64}
              comment="The server public key must be provided to the device. This allows the device 
        to decrypt any plain text data that has been encrypted using the derived encryption key."
            />
            <OutputField
              headerText="Encryption key"
              id="symmetricKeyBase64"
              alertMsg={this.props.showAlert}
              masked={true}
              rows="1"
              value={this.props.symmetricKeyBase64}
              comment="The encryption key (aka symmetric key) is used to encrypt plain text data in 
        a way that allows the data to be decrypted by the device. The encryption key should be 
        stored securely if you wish to later encrypt other plain text data without having to re-encrypt everything again."
            />
          </div>
        ) : (
          <div />
        )}

        {this.props.symmetricKey != "" ? (
          <div>
            <hr />
            <InputField
              headerText="Field value (plain text)"
              id="fieldValuePlain"
              alertMsg={this.props.showAlert}
              buttonClick={this.props.encryptField}
              buttonText="Encrypt text"
              comment="You can use the encryption key to encrypt plain-text. Simply paste a
          plain-text field value below and click encrypt."
            />
          </div>
        ) : (
          <div />
        )}

        {this.props.fieldValueEncryptedBase64 != "" ? (
          <OutputField
            headerText="Field value (encrypted)"
            id="fieldValueEncrypted"
            masked={false}
            alertMsg={this.props.showAlert}
            value={this.props.fieldValueEncryptedBase64}
            comment="The encrypted text can now be passed to the device. Note that the
        device needs the server public key in order to
        decrypt the encrypted text."
          />
        ) : (
          <div />
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    serverPublicKeyBase64: state.editorTools.serverPublicKeyBase64,
    symmetricKeyBase64: state.editorTools.symmetricKeyBase64,
    symmetricKey: state.editorTools.symmetricKey,
    fieldValueEncryptedBase64: state.editorTools.fieldValueEncryptedBase64
  };
}

const mapDispatchToProps = dispatch => {
  return {
    importDevicePublicKey: devicePublicKeyBase64 =>
      dispatch(actionsEncryption.importDevicePublicKey(devicePublicKeyBase64)),
    importSymmetricKey: symmetricKeyBase64 =>
      dispatch(actionsEncryption.importSymmetricKey(symmetricKeyBase64)),
    encryptField: fieldValuePlainText =>
      dispatch(actionsEncryption.encryptField(fieldValuePlainText)),
    resetAllKeys: () => dispatch(actionsEncryption.resetAllKeys()),
    showAlert: (type, message) =>
      dispatch(actionsAlert.set({ type: type, message: message })),
    toggleEncryptionSideBar: () =>
      dispatch(actionsEncryption.toggleEncryptionSideBar())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EncryptionModal);
