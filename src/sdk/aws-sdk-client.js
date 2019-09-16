import AWS from "aws-sdk";

class AwsSdk {
  constructor(accessKeyId, secretAccessKey) {
    this.aws3 = new AWS.S3({
      accessKeyId,
      secretAccessKey
    });
  }

  selectObjectContent(params) {
    return new Promise((resolve, reject) => {
      this.aws3.selectObjectContent(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          let result = "";
          const events = data.Payload;
          for (const event of events) {
            if (event.Records) {
              result = result.concat(event.Records.Payload.toString());
            } else if (event.Stats) {
              console.log(
                `Processed ${event.Stats.Details.BytesProcessed} bytes`
              );
            } else if (event.End) {
              console.log("SelectObjectContent completed");
              resolve(result);
            }
          }
        }
      });
    });
  }
}

export default AwsSdk;
