// @flow

import ClientAPIs from '../ClientAPIs'
import type { StorageGetFileParams, StorageSetFileParams } from '../types'

export default class StorageAPIs extends ClientAPIs {
  writeFile(params: StorageSetFileParams): Promise<null> {
    return this._rpc.request('storage_writeFile', params)
  }

  readFile(params: StorageGetFileParams): Promise<string> {
    return this._rpc.request('storage_readFile', params)
  }

  deleteFile(params: StorageGetFileParams): Promise<null> {
    return this._rpc.request('storage_deleteFile', params)
  }

  listFiles(): Promise<Array<string>> {
    return this._rpc.request('storage_listFiles', {})
  }
}
