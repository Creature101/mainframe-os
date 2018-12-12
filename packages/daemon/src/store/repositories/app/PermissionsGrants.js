// @flow

import { List, Record } from 'immutable'

export class WebRequestGrants extends Record({
  denied: (List(): List<string>),
  granted: (List(): List<string>),
}) {
  constructor(data: Object) {
    super({
      denied: List(data.denied),
      granted: List(data.granted),
    })
  }
}

export default class PermissionGrants extends Record({
  BLOCKCHAIN_SEND: (undefined: ?boolean),
  WEB_REQUEST: (undefined: ?WebRequestGrants),
}) {
  constructor(data: Object) {
    super({
      BLOCKCHAIN_SEND: data.BLOCKCHAIN_SEND,
      WEB_REQUEST: new WebRequestGrants(data.WEB_REQUEST),
    })
  }
}
