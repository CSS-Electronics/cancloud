/** 
 * StorageResponses receives response from storage API 
 * and formats it to match the structure required by Browser UI
 * e.g response = { 'jsonrpc' : 2.0, result: { FETCHED_RESULT }, id: 1}
 */

import { JSON_RPC_VERSION, UI_VERSION, RESPONSE_ID } from './constants'

const storageResponses = {
  makeDefaultResponse: (key, result) => {
    let response = {
      "jsonrpc": JSON_RPC_VERSION,
      "result": {},
      "id": RESPONSE_ID
    }
    
    response.result[key] = result
    response.result['uiVersion'] = UI_VERSION
    return response
  }
}

export default storageResponses

