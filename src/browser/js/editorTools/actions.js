import * as alertActions from "../alert/actions";

export const SET_DEVICE_PUBLIC_KEY = "editorTools/SET_DEVICE_PUBLIC_KEY";
export const SET_SERVER_PUBLIC_KEY = "editorTools/SET_SERVER_PUBLIC_KEY";
export const SET_SERVER_SECRET_KEY = "editorTools/SET_SERVER_SECRET_KEY";
export const SET_SYMMETRIC_KEY_BASE64 = "editorTools/SET_SYMMETRIC_KEY_BASE64";
export const SET_SYMMETRIC_KEY = "editorTools/SET_SYMMETRIC_KEY";
export const SET_ENCRYPTED_FIELD = "editorTools/SET_ENCRYPTED_FIELD";
export const TOGGLE_ENCRYPTION_SIDEBAR =
  "editorTools/TOGGLE_ENCRYPTION_SIDEBAR";
export const TOGGLE_SCHEMA_SIDEBAR = "editorTools/TOGGLE_SCHEMA_SIDEBAR";
export const TOGGLE_FILTER_SIDEBAR = "editorTools/TOGGLE_FILTER_SIDEBAR";
export const TOGGLE_DEVICE_FILE_TABLE = "editorTools/TOGGLE_DEVICE_FILE_TABLE";
export const TOGGLE_CRC_SIDEBAR = "editorTools/TOGGLE_CRC_SIDEBAR";
export const TOGGLE_BITRATE_SIDEBAR = "editorTools/TOGGLE_BITRATE_SIDEBAR";
export const TOGGLE_PARTIAL_CONFIG_LOADER_SIDEBAR = "editorTools/TOGGLE_PARTIAL_CONFIG_LOADER_SIDEBAR";
export const SET_CRC32_EDITOR_LIVE = "editorTools/SET_CRC32_EDITOR_LIVE";
export const SET_CRC32_EDITOR_PRE = "editorTools/SET_CRC32_EDITOR_PRE";
export const OPEN_DEVICE_FILE_TABLE = "editorTools/OPEN_DEVICE_FILE_TABLE";
export const CLOSE_EDITOR_SIDEBARS = " editorTools/CLOSE_EDITOR_SIDEBARS";

const { detect } = require("detect-browser");
const browser = detect();

let crcBrowserSupport = 0;

if (
  browser.name != "chrome" &&
  browser.name != "firefox" &&
  browser.name != "opera" &&
  browser.name != "safari" &&
  browser.name != "edge"
) {
  crcBrowserSupport = 0;
} else {
  crcBrowserSupport = 1;
}

export const toggleDeviceFileTable = () => ({
  type: TOGGLE_DEVICE_FILE_TABLE
});

export const toggleEditorSchemaSideBar = () => ({
  type: TOGGLE_SCHEMA_SIDEBAR
});

export const toggleBitRateSideBar = () => ({
  type: TOGGLE_BITRATE_SIDEBAR
});

export const togglePartialConfigLoaderSideBar = () => ({
  type: TOGGLE_PARTIAL_CONFIG_LOADER_SIDEBAR
});

export const closeEditorToolsSideBars = () => ({
  type: CLOSE_EDITOR_SIDEBARS
});

export const toggleFilterSideBar = () => ({
  type: TOGGLE_FILTER_SIDEBAR
});

export const toggleCrcSideBar = () => ({
  type: TOGGLE_CRC_SIDEBAR
});

export const openDeviceFileTable = () => ({
  type: OPEN_DEVICE_FILE_TABLE
});

export const calcCrc32EditorLive = () => {
  return function(dispatch, getState) {
    let formData = getState().editor.formData

    if (crcBrowserSupport == 1 && formData) {

      const { crc32 } = require("crc");
      let crc32EditorLive = crc32(JSON.stringify(formData, null, 2))
        .toString(16)
        .toUpperCase()
        .padStart(8, "0");

        dispatch(setCrc32EditorLive(crc32EditorLive));
      } else {
      let crc32EditorLive = `N/A`;
      dispatch(setCrc32EditorLive(crc32EditorLive));
    }

  };
};

export const setCrc32EditorLive = crc32EditorLive => ({
  type: SET_CRC32_EDITOR_LIVE,
  crc32EditorLive
});

export const setCrc32EditorPre = crc32EditorPre => ({
  type: SET_CRC32_EDITOR_PRE,
  crc32EditorPre
});

// convert BufferArray to Base64 string
function arrayBufferToBase64(buffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function checkBrowserVersion(dispatch) {
  if (browser.name != "firefox" && location.protocol == "http:") {
    dispatch(
      alertActions.set({
        type: "info",
        message: `The encryption tool is not supported over http:// via Chrome. Please use https:// or switch to Firefox.`,
        autoClear: true
      })
    );
    return 0;
  }
  if (
    browser.name != "chrome" &&
    browser.name != "firefox" &&
    browser.name != "opera" &&
    browser.name != "safari"
  ) {
    dispatch(
      alertActions.set({
        type: "danger",
        message: `The encryption tool is not supported on ${
          browser.name
        } - please use Chrome, Firefox or Opera instead.`,
        autoClear: true
      })
    );
    return 0;
  }
}

// import devicePublicKeyBase64 BufferArray into webcrypto API
export const importDevicePublicKey = devicePublicKeyBase64 => {
  return function(dispatch) {
    if (checkBrowserVersion(dispatch) == 0) {
      return;
    }

    if (devicePublicKeyBase64.length != 88) {
      dispatch(
        alertActions.set({
          type: "danger",
          message: `The device public key, "${devicePublicKeyBase64}", is invalid (length is ${
            devicePublicKeyBase64.length
          } - should be 88)`,
          autoClear: true
        })
      );
      return;
    }

    const preByte = new Buffer([4]);
    let devicePublicKeyBuf = new Buffer(devicePublicKeyBase64, "base64");
    devicePublicKeyBuf = Buffer.concat([preByte, devicePublicKeyBuf]);

    window.crypto.subtle
      .importKey(
        "raw",
        devicePublicKeyBuf,
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        []
      )
      .then(function(devicePublicKey) {
        dispatch(
          alertActions.set({
            type: "info",
            message:
              "New server public key & encryption key successfully generated",
            autoClear: true
          })
        );
        dispatch(setDevicePublicKey(devicePublicKey));
        dispatch(generateAsymmetricKeys(devicePublicKey));
      })
      .catch(err => {
        dispatch(
          alertActions.set({
            type: "danger",
            message:
              "The device public key is invalid. Please review it and try again.",
            autoClear: true
          })
        );
        console.error(err);
      });
  };
};

export const setDevicePublicKey = devicePublicKey => ({
  type: SET_DEVICE_PUBLIC_KEY,
  devicePublicKey
});

// generate user asymmetric key pair (public & private) + use the secret key to derive shared secret
export const generateAsymmetricKeys = devicePublicKey => {
  return function(dispatch) {
    window.crypto.subtle
      .generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        ["deriveKey", "deriveBits"]
      )
      .then(function(serverKeys) {
        dispatch(
          deriveSharedSecretBits(devicePublicKey, serverKeys.privateKey)
        );
        dispatch(exportUserPublicKey(serverKeys.publicKey));
      })
      .catch(err => {
        console.error(err);
      });
  };
};

// export user public key for use in config file SECURITY section
export const exportUserPublicKey = userPublicKey => {
  return function(dispatch) {
    window.crypto.subtle
      .exportKey("raw", userPublicKey)
      .then(keydata => {
        dispatch(setServerPublicKey(arrayBufferToBase64(keydata.slice(1, 65))));
      })
      .catch(err => {
        console.error(err);
      });
  };
};

export const setServerPublicKey = serverPublicKeyBase64 => ({
  type: SET_SERVER_PUBLIC_KEY,
  serverPublicKeyBase64
});

// derive shared secret based on device public key and the newly generated user secret key
export const deriveSharedSecretBits = (devicePublicKey, userSecretKey) => {
  return function(dispatch) {
    window.crypto.subtle
      .deriveBits(
        {
          name: "ECDH",
          namedCurve: "P-256",
          public: devicePublicKey
        },
        userSecretKey,
        256
      )
      .then(function(sharedSecretBits) {
        const sharedSecretArray = new Uint8Array(sharedSecretBits);
        dispatch(createSymmetricKey(sharedSecretArray));
      })
      .catch(err => {
        console.error(err);
      });
  };
};

// import shared secret ArrayBuffer into CryptoKey (HMAC SHA-256) + create symmetric key via HMAC SHA-256 and "config" as static data
export const createSymmetricKey = sharedSecretArray => {
  return function(dispatch) {
    window.crypto.subtle
      .importKey(
        "raw",
        sharedSecretArray,
        {
          name: "HMAC",
          hash: {
            name: "SHA-256"
          },
          length: 256
        },
        true,
        ["sign", "verify"]
      )
      .then(function(sharedSecretKey) {
        dispatch(hmacSha256(sharedSecretKey, "config")); // note that "config" is a pre-specified string also used by the device
      })
      .catch(err => {
        console.error(err);
      });
  };
};

// calculate symmetric key from shared secret using hmac-sha256 and static data
export const hmacSha256 = (sharedSecretKey, msg) => {
  const msgBuf = new TextEncoder("utf-8").encode(msg);
  return function(dispatch) {
    window.crypto.subtle
      .sign(
        {
          name: "HMAC"
        },
        sharedSecretKey,
        msgBuf
      )
      .then(function(h) {
        const symmetricKeyBuf = h.slice(0, 16);
        const symmetricKeyBase64 = arrayBufferToBase64(symmetricKeyBuf);

        dispatch(setSymmetricKeyBase64(symmetricKeyBase64));
        dispatch(importSymmetricKey(symmetricKeyBase64));
      })
      .catch(err => {
        console.error(err);
      });
  };
};

// Set the encryption key aka symmetric key in base64
export const setSymmetricKeyBase64 = symmetricKeyBase64 => ({
  type: SET_SYMMETRIC_KEY_BASE64,
  symmetricKeyBase64
});

// Import the symmetric key (base 64) into a crypto key object
export const importSymmetricKey = symmetricKeyBase64 => {
  return function(dispatch) {
    if (checkBrowserVersion(dispatch) == 0) {
      return;
    }
    window.crypto.subtle
      .importKey(
        "raw",
        new Buffer(symmetricKeyBase64, "base64"),
        {
          name: "AES-CTR"
        },
        true,
        ["encrypt", "decrypt"]
      )
      .then(function(symmetricKey) {
        dispatch(setSymmetricKey(symmetricKey));
      })
      .catch(err => {
        dispatch(
          alertActions.set({
            type: "danger",
            message:
              "The encryption key is invalid. Please review it and try again.",
            autoClear: true
          })
        );
        console.error(err);
      });
  };
};

// Set the encryption key aka symmetric key as crypto object
export const setSymmetricKey = symmetricKey => ({
  type: SET_SYMMETRIC_KEY,
  symmetricKey
});

// encrypt message field using the imported symmetric key and AES-CTR
export const encryptField = fieldValuePlainText => {
  return function(dispatch, getState) {
    var enc = new TextEncoder("utf-8");
    const counter = window.crypto.getRandomValues(new Uint8Array(16)); // serves as initialization vector
    window.crypto.subtle
      .encrypt(
        {
          name: "AES-CTR",
          counter: counter,
          length: 128
        },
        getState().editorTools.symmetricKey,
        enc.encode(fieldValuePlainText)
      )
      .then(function(fieldValueEncryptedCt) {
        const fieldValueEncryptedCtTyped = new Uint8Array(
          fieldValueEncryptedCt
        );

        var fieldValueEncrypted = new Uint8Array(
          counter.length + fieldValueEncryptedCtTyped.length
        );
        fieldValueEncrypted.set(counter);
        fieldValueEncrypted.set(fieldValueEncryptedCtTyped, counter.length);
        const fieldValueEncryptedBase64 = arrayBufferToBase64(
          fieldValueEncrypted
        );
        dispatch(setEncryptedField(fieldValueEncryptedBase64));
      })
      .catch(err => {
        console.error(err);
      });
  };
};

// Set the encrypted field
export const setEncryptedField = fieldValueEncryptedBase64 => ({
  type: SET_ENCRYPTED_FIELD,
  fieldValueEncryptedBase64
});

export const resetAllKeys = () => {
  return function(dispatch) {
    dispatch(setEncryptedField(""));
    dispatch(setSymmetricKeyBase64(""));
    dispatch(setSymmetricKey(""));
    dispatch(setServerPublicKey(""));
  };
};

export const toggleEncryptionSideBar = () => ({
  type: TOGGLE_ENCRYPTION_SIDEBAR
});
