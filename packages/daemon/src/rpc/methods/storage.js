// @flow

import {
  STORAGE_GET_FILE_SCHEMA,
  STORAGE_SET_FILE_SCHEMA,
  type StorageGetFileParams,
  type StorageSetFileParams,
} from '@mainframe/client'

import type RequestContext from '../RequestContext'

export const writeFile = {
  params: STORAGE_SET_FILE_SCHEMA,
  handler: async (
    ctx: RequestContext,
    params: StorageSetFileParams,
  ): Promise<null> => {
    // TODO
    return new Promise(() => {})
  },
}

// export const readFile = (ctx: RequestContext): Promise<string> => {}

// export const deleteFile = (ctx: RequestContext): Promise<null> => {}

// export const listFiles = (ctx: RequestContext): Promise<Array<string>> => {}
