// @flow

import { List, Record } from 'immutable'

export default class PermissionRequirements extends Record({
  BLOCKCHAIN_SEND: (undefined: ?boolean),
  WEB_REQUEST: (List(): List<string>),
}) {
  constructor(data: Object) {
    super({
      BLOCKCHAIN_SEND: data.BLOCKCHAIN_SEND,
      WEB_REQUEST: List(data.WEB_REQUEST),
    })
  }
}
