import { isString } from './helpers.js'

// List of currently supported endpoints.
let awsS3Endpoint = {
  'us-east-1': 's3.amazonaws.com',
  'us-east-2': 's3-us-east-2.amazonaws.com',
  'us-west-1': 's3-us-west-1.amazonaws.com',
  'us-west-2': 's3-us-west-2.amazonaws.com',
  'ca-central-1': 's3.ca-central-1.amazonaws.com',
  'eu-west-1': 's3-eu-west-1.amazonaws.com',
  'eu-west-2': 's3-eu-west-2.amazonaws.com',
  'sa-east-1': 's3-sa-east-1.amazonaws.com',
  'eu-central-1': 's3-eu-central-1.amazonaws.com',
  'ap-south-1': 's3-ap-south-1.amazonaws.com',
  'ap-southeast-1': 's3-ap-southeast-1.amazonaws.com',
  'ap-southeast-2': 's3-ap-southeast-2.amazonaws.com',
  'ap-northeast-1': 's3-ap-northeast-1.amazonaws.com',
  'cn-north-1': 's3.cn-north-1.amazonaws.com.cn',
  'eu-north-1' : 's3-eu-north-1.amazonaws.com',
  'eu-west-3' :  's3-eu-west-3.amazonaws.com',
  'me-south-1' :  's3-me-south-1.amazonaws.com',
  'eu-south-1' :  's3-eu-south-1.amazonaws.com',
  'ap-northeast-2' :  's3-ap-northeast-2.amazonaws.com',
  'ap-northeast-3' :  's3-ap-northeast-3.amazonaws.com',
  'ap-east-1' :  's3-ap-east-1.amazonaws.com',
  'af-south-1' :  's3-af-south-1.amazonaws.com'
  // Add new endpoints here.
}

// getS3Endpoint get relevant endpoint for the region.
export function getS3Endpoint(region) {
  if (!isString(region)) {
    throw new TypeError(`Invalid region: ${region}`)
  }
  var endpoint = awsS3Endpoint[region]
  if (endpoint) {
    return endpoint
  }
  return 's3.amazonaws.com'
}
