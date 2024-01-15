import jwt from "jsonwebtoken";
import _ from "lodash";
import fileReaderStream from "filereader-stream";
import str from "string-to-stream";

import { promisify, removeFirstOccurence } from "./helpers";
import { SECRET_CODE } from "../browser/js/constants";
import { S3Client } from "./s3client";
import StorageResponses from "./response";
import AwsSdk from "./aws-sdk-client";
import storage from 'local-storage-fallback'


class S3Explorer {


  constructor(options, token) {
    // when the region has been stored in cache, we can now load it from here
    if (storage.getItem('region')) {
      var region = storage.getItem('region')
    }
    if (token) {
      let sessionObj = jwt.verify(token, SECRET_CODE);
      this.endPoint = sessionObj.endPoint;
      this.accessKey = sessionObj.accessKey;
      this.secretKey = sessionObj.secretKey;
      this.s3Client = S3Client(
        sessionObj.endPoint,
        sessionObj.accessKey,
        sessionObj.secretKey,
        region
      );
      this.bucketName = sessionObj.bucketName;
    } else if (options.endPoint) {
      // when the user needs to log in, the region is parsed based on the options provided
      this.s3Client = S3Client(
        options.endPoint,
        options.accessKey,
        options.secretKey,
        options.region
      );
      this.endPoint = options.endPoint;
      this.accessKey = options.accessKey;
      this.secretKey = options.secretKey;
      this.bucketName = options.bucketName;
      this.region = options.region
    }

    this.AwsSdk = new AwsSdk(this.accessKey, this.secretKey, this.endPoint);
  }

  /**
   * @method: getSessionsObject
   * @param {@} cb
   * @description: Saved session when ListObject API is working fine.
   */

  getSessionsObject(cb) {
    var stream = this.s3Client.listObjects(this.bucketName, "", false);
    let objectsArray = [];
    stream.on("data", function(obj) {
      if ((obj.name && !obj.name.endsWith("/")) || obj.prefix) {
        obj["name"] = obj.prefix ? obj.prefix : obj.name;
        objectsArray.push(obj);
      }
    });
    let dataObj = {
      endPoint: this.endPoint,
      accessKey: this.accessKey,
      secretKey: this.secretKey,
      bucketName: this.bucketName
    };
    stream.on("end", function() {
      var token = jwt.sign(dataObj, SECRET_CODE);
      let response = StorageResponses.makeDefaultResponse("token", token);
      cb(null, response);
    });
    stream.on("error", function(err) {
      cb(err);
    });
  }

  // list s3 compatible storage buckets
  listBuckets(marker, cb) {
    marker = marker ? marker : "";
    var stream = this.s3Client.listObjects(this.bucketName, "", marker, false);
    let objectsArray = [];
    stream.on("data", function(obj) {
      if (obj.prefix) {
        obj["name"] = obj.prefix.substring(0, obj.prefix.length - 1);
        let loggerRegex = new RegExp(/([0-9A-Fa-f]){8}|(server)\b/g);
        if (loggerRegex.test(obj.name)) {
          objectsArray.push(obj);
        }
      }
    });
    stream.on("end", function() {
      let response = StorageResponses.makeDefaultResponse(
        "buckets",
        objectsArray
      );
      cb(null, response);
    });
    stream.on("error", function(err) {
      cb(err);
    });
  }

  /**
   * @method: storageInfo
   * @param {*} cb
   * @description: Return the storage information. It is not applicable for the CSS.
   */

  storageInfo(cb) {
    let storageInfo = StorageResponses.makeDefaultResponse("storageInfo", {});
    cb(null, storageInfo);
  }

  /**
   * @method: serverInfo
   * @param {*} cb
   * @description: Return the server information. It is not applicable for the CSS.
   */

  serverInfo(cb) {
    let serverInfo = StorageResponses.makeDefaultResponse("result", {});
    cb(null, serverInfo);
  }

  /**
   * @description list bucket objects
   * @param {*} bucketName
   * @param {*} prefix
   * @param {*} marker
   * @param {*} cb
   */
  listObjects(bucketName, prefix, marker, cb) {
    var stream;
    let updatedPrefix = bucketName + "/" + prefix;
    if ("Home" == bucketName) {
      stream = this.s3Client.listObjects(
        this.bucketName,
        prefix,
        marker,
        false
      );
    } else {
      stream = this.s3Client.listObjects(
        this.bucketName,
        updatedPrefix,
        marker,
        false
      );
    }

    let objectsArray = [];
    stream.on("data", function(obj) {
      if ((obj.name && !obj.name.endsWith("/")) || obj.prefix) {
        obj["name"] = obj.prefix
          ? removeFirstOccurence(obj.prefix, updatedPrefix)
          : removeFirstOccurence(obj.name, updatedPrefix);
        objectsArray.push(obj);
      }
    });
    stream.on("end", function() {
      let response = StorageResponses.makeDefaultResponse(
        "objects",
        objectsArray
      );
      cb(null, response);
    });
    stream.on("error", function(err) {
      cb(err);
    });
  }

  /**
   * @description list bucket objects
   * @param {*} bucketName
   * @param {*} prefix
   * @param {*} marker
   * @param {*} cb
   */
  listObjectsV2(bucketName, prefix, marker, cb) {
    var stream;
    let updatedPrefix = bucketName + "/" + prefix;
    if ("Home" == bucketName) {
      stream = this.s3Client.listObjectsV2(
        this.bucketName,
        prefix,
        marker,
        false
      );
    } else {
      stream = this.s3Client.listObjectsV2(
        this.bucketName,
        updatedPrefix,
        marker,
        false
      );
    }

    let objectsArray = [];
    stream.on("data", function(obj) {
      if ((obj.name && !obj.name.endsWith("/")) || obj.prefix) {
        obj["name"] = obj.prefix
          ? removeFirstOccurence(obj.prefix, updatedPrefix)
          : removeFirstOccurence(obj.name, updatedPrefix);
        objectsArray.push(obj);
      }
    });
    stream.on("end", function() {
      let response = StorageResponses.makeDefaultResponse(
        "objects",
        objectsArray
      );
      cb(null, response);
    });
    stream.on("error", function(err) {
      cb(err);
    });
  }

  // list bucket objects from S3 compatible storage
  listObjectsRecursive(bucketName, prefix, marker, cb) {
    var stream;
    let objectNameWithPrefix = bucketName + "/" + prefix;
    if ("Home" == bucketName) {
      if(marker == ""){
        // faster if no marker is available
        stream = this.s3Client.listObjectsV2(this.bucketName, prefix, true);
      } else{
        stream = this.s3Client.listObjects(this.bucketName, prefix, marker, true);
      }

    } else {
      stream = this.s3Client.listObjects(
        this.bucketName,
        objectNameWithPrefix,
        marker,
        true
      );
    }

    let objectsArray = [];
    let iCount = 0;

    // look into optimizing this part
    stream.on("data", function(obj) {
      if (obj.name || obj.prefix) {
        obj["name"] = obj.prefix ? obj.prefix : obj.name;
        objectsArray.push(obj);
        iCount += 1;
      }
    });
    stream.on("end", function() {
      let response = StorageResponses.makeDefaultResponse(
        "objects",
        objectsArray
      );
      cb(null, response);
    });
    stream.on("error", function(err) {
      cb(err);
    });
  }

  

  // Make bucket to S3 compatible storage
  makeBucket(bucketName, region, cb) {
    this.s3Client.makeBucket(bucketName, region, function(err) {
      if (err) {
        return cb(err);
      }
      let response = StorageResponses.makeDefaultResponse(
        "message",
        `${bucketName} is created successfully`
      );
      cb(null, response);
    });
  }

  // delete bucket from S3 compatible storage
  deleteBucket(bucketName, cb) {
    this.s3Client.removeBucket(bucketName, function(err) {
      if (err) {
        return cb(err);
      }
      let response = StorageResponses.makeDefaultResponse(
        "message",
        `bucket ${bucketName} is deleted successfully`
      );
      return cb(null, response);
    });
  }

  /**
   *
   * @param {*} bucketName
   * @param {*} objects
   * @param {*} cb
   */
  removeObject(bucketName, objects, cb) {
    let objectNameWithPrefix;
    if ("Home" == bucketName) {
      objectNameWithPrefix = objects.toString();
    } else {
      objectNameWithPrefix = bucketName + "/" + objects.toString();
    }

    this.s3Client.removeObject(this.bucketName, objectNameWithPrefix, function(
      err
    ) {
      if (err) {
        return cb(err);
      }
      let response = StorageResponses.makeDefaultResponse(
        "message",
        `${bucketName} object deleted successfully`
      );
      return cb(null, response);
    });
  }

  // List All bucket policies from S3 compatible resources
  listAllBucketPolicies(bucketName, cb) {
    this.s3Client.getBucketPolicy(bucketName, function(err, policy) {
      if (err) {
        return cb(err);
      }
      let response = StorageResponses.makeDefaultResponse("policies", null);
      return cb(null, response);
    });
  }

  // Put object into the bucket of S3 compatible resources
  putObject(objectName, file, cb) {
    let strm = str(file);
    let fileStream = fileReaderStream(file);
    this.s3Client.putObject(this.bucketName, objectName, strm, function(
      err,
      etag
    ) {
      if (err) {
        return cb(err);
      }
      let response = StorageResponses.makeDefaultResponse("etag", etag);

      return cb(err, response);
    });
  }

  // Put file into the bucket of S3 compatible resources
  fPutObject(bucketName, objectName, file, cb) {
    var metaData = {
      "Content-Type": "application/octet-stream"
    };
    this.s3Client.fPutObject(bucketName, objectName, file, metaData, function(
      err,
      etag
    ) {
      if (err) {
        return cb(err);
      }
      let response = StorageResponses.makeDefaultResponse("etag", etag);
      return cb(err, response);
    });
  }

  /**
   * @description: get per-signed URL to share and fetch the object
   * @param {*} bucketName
   * @param {*} objectName
   * @param {*} expiry
   * @param {*} cb
   */
  presignedGet(bucketName, objectName, expiry, cb) {
    let objectNameWithPrefix;
    if ("Home" == bucketName) {
      objectNameWithPrefix = objectName;
    } else {
      objectNameWithPrefix = bucketName + "/" + objectName;
    }

    this.s3Client.presignedUrl(
      "GET",
      this.bucketName,
      objectNameWithPrefix,
      expiry,
      function(err, presignedUrl) {
        if (err) {
          return cb(err);
        }
        let response = StorageResponses.makeDefaultResponse(
          "url",
          presignedUrl
        );

        return cb(err, response);
      }
    );
  }

  // Get bucket object signed URL to share or get object from S3 compatible resourses
  presignedGetObj(bucketName, objectName, expiry, cb) {
    let objectNameWithPrefix;
    if ("Home" == bucketName) {
      objectNameWithPrefix = objectName;
    } else {
      objectNameWithPrefix = bucketName + "/" + objectName;
    }

    this.s3Client.presignedUrl(
      "GET",
      this.bucketName,
      objectNameWithPrefix,
      expiry,
      function(err, presignedUrl) {
        if (err) {
          return cb(err);
        }
        let response = StorageResponses.makeDefaultResponse("obj", {
          url: presignedUrl,
          objectName: objectName
        });

        return cb(err, response);
      }
    );
  }

  /**
   * @method: presignedPutObject
   * @description : Getting presigned URL put an object in the storage
   * @param {*} bucketName
   * @param {*} objectName
   * @param {*} expiry
   * @param {*} cb
   */
  presignedPutObject(bucketName, objectName, expiry, cb) {
    let objectNameWithPrefix;
    if ("Home" == bucketName) {
      objectNameWithPrefix = objectName.replace(/_/g, "/");
    } else {
      objectNameWithPrefix = `${bucketName}/${objectName.replace(/_/g, "/")}`;
    }
    this.s3Client.presignedPutObject(
      this.bucketName,
      objectNameWithPrefix,
      expiry,
      function(err, presignedUrl) {
        if (err) {
          return cb(err);
        }
        let response = StorageResponses.makeDefaultResponse(
          "url",
          presignedUrl
        );
        return cb(err, response);
      }
    );
  }

  /**
   * Create URL Token with jwt signing
   */
  createURLToken(cb) {
    let defaultExpiry = 24 * 60 * 60;
    let payload = {
      exp: defaultExpiry,
      sub: this.accessKey
    };
    let token = jwt.sign(payload, this.secretKey);
    let response = StorageResponses.makeDefaultResponse("token", token);
    return cb(null, response);
  }

  /**
   * @method: getObjectStat
   * @description: get meta data and stat information of the object
   * @params {bucketName, objectName, callback}
   */

  getObjectStat(bucketName, objectName, cb) {
    let objectWithPrefix;
    if ("Home" == bucketName) {
      objectWithPrefix = objectName;
    } else {
      objectWithPrefix = bucketName + "/" + objectName;
    }

    this.s3Client.headObject(this.bucketName, objectWithPrefix, function(
      err,
      stat
    ) {
      if (err) {
        return cb(err);
      }
      let response = StorageResponses.makeDefaultResponse("metaInfo", stat);
      return cb(null, response);
    });
  }

  getEndpointAndBucketName(cb) {
    const obj = {
      bucketName: this.bucketName,
      endPoint: this.endPoint
    };
    const response = StorageResponses.makeDefaultResponse("savedEndpoint", obj);
    return cb(null, response);
  }

  /**
   * @name: widgetQuery
   * @description: Get widget data from the S3 select query
   */

  getWidgetQueryResult(dataFileName, sqlExpression, cb) {
    const params = {
      Bucket: this.bucketName,
      Key: dataFileName,
      ExpressionType: "SQL",
      Expression: sqlExpression,
      InputSerialization: {
        CSV: {
          FileHeaderInfo: "USE",
          RecordDelimiter: "\n",
          FieldDelimiter: ","
        }
      },
      OutputSerialization: {
        JSON: {
          RecordDelimiter: "\n"
        }
      }
    };

    const s3SelectObject = this.AwsSdk.selectObjectContent(params);
    s3SelectObject
      .then(data => {
        const records = _.map(
          _.filter(data.split("\n"), record => record),
          record => JSON.parse(record)
        );

        const dataset = [];
        _.forEach(_.keys(records[0]), value => {
          const obj = {};
          obj["label"] = value;
          obj["data"] = _.map(records, value);
          dataset.push(obj);
        });

        const response = StorageResponses.makeDefaultResponse("records", {
          dataset,
          records
        });

        return cb(null, response);
      })
      .catch(err => {
        console.log("err", err);
        console.log("Attempted SQL expression:", sqlExpression);
        return cb(err);
      });
  }

  /**
   * @name: getPartialObject
   * @description: Get object content based on the pre-defined range i.e 10kb
   */

  getPartialObject(bucketName, objectName, offset, byteLength, cb) {
    let objectNameWithPrefix;
    if ("Home" == bucketName) {
      objectNameWithPrefix = objectName;
    } else {
      objectNameWithPrefix = bucketName + "/" + objectName;
    }
    let type = "bytes"
    let partialContent = ""

    if(type == "bytes"){
      partialContent = [];
    }
    this.s3Client.getPartialObject(
      this.bucketName,
      objectNameWithPrefix,
      offset,
      byteLength,
      (err, stream) => {
        
        // if (err) {
        //   console.log(err);
        //   return cb(err);
        // }
        if(type == "bytes"){

          stream.on("data", function(chunk) {
            partialContent.push(chunk)
            
          });
        }
        else{
          stream.on("data", function(chunk) {
            partialContent += chunk.toString();
            
          });
        }
        stream.on("end", function() {
          if(type == "bytes" && partialContent.length == 2){
            partialContent = [Uint8ClampedArray.from(partialContent.reduce((a, b) => [...a, ...b], []))]
          }

          const response = StorageResponses.makeDefaultResponse(
            "objContent",
            partialContent
          );
          return cb(null, response);
        });
        stream.on("error", function(err) {
          console.log(err);
          return cb(err);
        });
      }
    );
  }
}

S3Explorer.prototype.getSessionsObject = promisify(
  S3Explorer.prototype.getSessionsObject
);
S3Explorer.prototype.listBuckets = promisify(S3Explorer.prototype.listBuckets);
S3Explorer.prototype.listObjects = promisify(S3Explorer.prototype.listObjects);
S3Explorer.prototype.listObjectsV2 = promisify(S3Explorer.prototype.listObjectsV2);

S3Explorer.prototype.listPublicBucketObject = promisify(
  S3Explorer.prototype.listPublicBucketObject
);
S3Explorer.prototype.listObjectsRecursive = promisify(
  S3Explorer.prototype.listObjectsRecursive
);
S3Explorer.prototype.storageInfo = promisify(S3Explorer.prototype.storageInfo);
S3Explorer.prototype.makeBucket = promisify(S3Explorer.prototype.makeBucket);

S3Explorer.prototype.deleteBucket = promisify(
  S3Explorer.prototype.deleteBucket
);

S3Explorer.prototype.removeObject = promisify(
  S3Explorer.prototype.removeObject
);

S3Explorer.prototype.listAllBucketPolicies = promisify(
  S3Explorer.prototype.listAllBucketPolicies
);

S3Explorer.prototype.putObject = promisify(S3Explorer.prototype.putObject);

S3Explorer.prototype.fPutObject = promisify(S3Explorer.prototype.fPutObject);

S3Explorer.prototype.presignedGet = promisify(
  S3Explorer.prototype.presignedGet
);

S3Explorer.prototype.presignedPutObject = promisify(
  S3Explorer.prototype.presignedPutObject
);

S3Explorer.prototype.createURLToken = promisify(
  S3Explorer.prototype.createURLToken
);

S3Explorer.prototype.presignedGetObj = promisify(
  S3Explorer.prototype.presignedGetObj
);

S3Explorer.prototype.getObjectStat = promisify(
  S3Explorer.prototype.getObjectStat
);

S3Explorer.prototype.getEndpointAndBucketName = promisify(
  S3Explorer.prototype.getEndpointAndBucketName
);

S3Explorer.prototype.getWidgetQueryResult = promisify(
  S3Explorer.prototype.getWidgetQueryResult
);

S3Explorer.prototype.getPartialObject = promisify(
  S3Explorer.prototype.getPartialObject
);

module.exports = S3Explorer;
