// @flow

import ClientAPIs from '../ClientAPIs'

export default class StorageAPIs extends ClientAPIs {
  writeFile(filename: string, data: string): Promise<null> {
    return this._rpc.request('storage_writeFile', { filename, data })
  }

  readFile(filename: string): Promise<string> {
    return this._rpc.request('storage_readFile', { filename })
  }

  deleteFile(filename: string): Promise<null> {
    return this._rpc.request('storage_deleteFile', { filename })
  }

  listFiles(): Promise<Array<string>> {
    return this._rpc.request('storage_listFiles', {})
  }
}
