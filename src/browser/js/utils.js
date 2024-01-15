/*
 * MinIO Cloud Storage (C) 2016, 2018 MinIO, Inc.
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

import { minioBrowserPrefix } from "./constants.js";
import xml2js from "xml2js";
import _ from "lodash";

export const demoMode = false
export const demoDate = '2023.01.14 13:46:32'

export const sortObjectsByName = (objects, order) => {
  let folders = objects.filter(object => object.name.endsWith("/"));
  let files = objects.filter(object => !object.name.endsWith("/"));
  folders = folders.sort((a, b) => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
  files = files.sort((a, b) => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
  if (order) {
    folders = folders.reverse();
    files = files.reverse();
  }
  return [...folders, ...files];
};

export const sortObjectsBySize = (objects, order) => {
  let folders = objects.filter(object => object.name.endsWith("/"));
  let files = objects.filter(object => !object.name.endsWith("/"));
  files = files.sort((a, b) => a.size - b.size);
  if (order) files = files.reverse();
  return [...folders, ...files];
};

export const sortObjectsByDate = (objects, order) => {
  let folders = objects.filter(object => object.name.endsWith("/"));
  let files = objects.filter(object => !object.name.endsWith("/"));
  files = files.sort(
    (a, b) =>
      new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
  );
  if (order) files = files.reverse();
  return [...folders, ...files];
};

export const pathSlice = path => {
  path = path.replace(minioBrowserPrefix, "");
  let prefix = "";
  let bucket = "";
  if (!path)
    return {
      bucket,
      prefix
    };
  let objectIndex = path.indexOf("/", 1);
  if (objectIndex == -1) {
    bucket = path.slice(1);
    return {
      bucket,
      prefix
    };
  }
  bucket = path.slice(1, objectIndex);
  prefix = path.slice(objectIndex + 1);
  return {
    bucket,
    prefix
  };
};

export const pathJoin = (bucket, prefix) => {
  if (!prefix) prefix = "";
  return minioBrowserPrefix + "/" + bucket + "/" + prefix;
};

export const removeFirstOccurence = (str, searchstr) => {
  var index = str.indexOf(searchstr);
  if (index === -1) {
    return str;
  }
  return str.slice(0, index) + str.slice(index + searchstr.length);
};

export const createDropdownOptions = Files => {
  Files = Files.sort().reverse();
  return (Files = Files.map(File => <option key={File}>{File}</option>));
};

export const isValidUISchema = file => {
  const regexUiSchema = new RegExp(
    "(^server_|^)uischema-\\d{2}\\.\\d{2}\\.json",
    "g"
  );
  return regexUiSchema.test(file);
};

export const isValidCanedgefile = file => {
  const regexFileExt = new RegExp(/\b(mf4|MF4|MFE|MFC|MFM|txt|TXT|csv|json|JSON)\b/, "g");
  return regexFileExt.test(file);
}

export const isValidLogfile = file => {
  const regexFileExt = new RegExp(/\b(mf4|MF4|MFE|MFC|MFM)\b/, "g");
  return regexFileExt.test(file);
}

export const isValidSchema = file => {
  const regexSchema = new RegExp(
    "(^([0-9A-Fa-f]){8}_|server_|^)schema-\\d{2}\\.\\d{2}\\.json",
    "g"
  );
  return regexSchema.test(file);
};

export const isValidConfig = file => {
  const regexConfig = new RegExp(
    "(^([0-9A-Fa-f]){8}_|server_|^)config-\\d{2}\\.\\d{2}\\.json",
    "g"
  );
  return regexConfig.test(file);
};

export const isValidDevice = device => {
  let loggerRegex = new RegExp(/([0-9A-Fa-f]){8}\b/g);
  return loggerRegex.test(device);
};

var options = {
  // options passed to xml2js parser
  explicitRoot: false, // return the root node in the resulting object?
  ignoreAttrs: true // ignore attributes, only create text nodes
};

export const parseXml = xml => {
  var result = null;
  var error = null;

  var parser = new xml2js.Parser(options);
  parser.parseString(xml, function (e, r) {
    error = e;
    result = r;
  });

  if (error) {
    throw new Error("XML parse error");
  }
  return result;
};

export function sdValidityTest(str) {
  // Extract substring starting from the 8th character (index 7) and 12 characters long
  var extractedSubstring = str.substring(8, 20);

  // Check if the substring matches the specified strings
  if (extractedSubstring === '534133324780' || extractedSubstring === '534130384780') {
      return true;
  } else {
      return false;
  }
}

export function get_first_timestamp(data) {
  let view = new DataView(data.buffer);

  /* Sanity check */
  if (data.length < 168) {
    return -1;
  }

  /* Check that the header matches the expected tool */
  let decoder = new TextDecoder();
  const s = decoder.decode(data.slice(16, 23)).trim();
  if (s !== "CE") {
    return -1;
  }

  /* Find first DG block */
  const addressDG = Number(view.getBigUint64(88, true));

  /* Sanity check */
  if (data.length < (addressDG + 40)) {
    return -1;
  }

  /* Find data block */
  const addressDT = Number(view.getBigUint64(addressDG + 40, true));

  /* Sanity check */
  if (data.length < (addressDT + 25)) {
    return -1;
  }

  /* Select method based on offset */
  let firstTimestamp = -1;
  if (addressDT > 100000) {
    firstTimestamp = Number(view.getBigUint64(addressDT + 25, true) & BigInt(0x0000FFFFFFFFFFFF)) * 1E-6;
  } else {
    firstTimestamp = view.getFloat64(addressDT + 25, true) * 1E-9;
  }

  /* Read start time */
  const startTime = Number(view.getBigUint64(136, true)) * 1E-9;

  return firstTimestamp + startTime;
}