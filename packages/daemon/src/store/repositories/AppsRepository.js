// @flow

import { MFID } from '@mainframe/data-types'
import { Map, Record } from 'immutable'

import PeerApp from './app/PeerApp'
import MFIDMapping from './MFIDMapping'
import Repository from './Repository'

export class AppsRepositoryValue extends Record({
  byMFID: (Map(): Map<string, MFIDMapping>),
  peer: (Map(): Map<string, PeerApp>),
}) {}

export default class AppsRepository extends Repository<AppsRepositoryValue> {
  constructor() {
    super(new AppsRepositoryValue())
  }

  // TODO: apps object type
  setPeerApps(apps: Object = {}) {
    const peer = Map(apps).map(PeerApp.fromJSON)
    const byMFID = Object.keys(apps).reduce((acc, id) => {
      const mfid = MFID.canonical(apps[id].manifest.id)
      acc[mfid] = id
      return acc
    }, {})

    this.update(value => {
      value.mergeIn(['byMFID'], byMFID)
      value.mergeIn(['peer'], peer)
    })
  }
}
