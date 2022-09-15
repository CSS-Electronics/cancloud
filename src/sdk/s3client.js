/*
 * CANCloud cloud storage browser
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

const StorageClient = require('./storage')
import { endPointSchema } from './helpers'

export function S3Client(endPoint, accessKey, secretKey, region = '') {
  let useSSL = false
  const parsedEndPoint = endPointSchema(endPoint)
 
  switch (parsedEndPoint.protocol) {
    case 'http:': {
      useSSL = false
      break
    }
    case 'https:': {
      useSSL = true
      break
    }
    default: {
      useSSL = false
    }
  }
  if (parseInt(parsedEndPoint.port)) {
    return new StorageClient.Client({
      endPoint: parsedEndPoint.hostname,
      port: parseInt(parsedEndPoint.port) || 80,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
      region:region
    })
  } else {
    return new StorageClient.Client({
      endPoint: parsedEndPoint.hostname,
      accessKey: accessKey,
      secretKey: secretKey,
      region:region
    })
  }
}
