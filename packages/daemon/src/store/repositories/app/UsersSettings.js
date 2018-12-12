// @flow

import {
  createStrictPermissionGrants,
  type PermissionGrant,
  type PermissionKey,
  type PermissionsGrants,
  type StrictPermissionsGrants,
} from '@mainframe/app-permissions'
import { type List, Map, Record } from 'immutable'

import AppPermissionsGrants from './PermissionsGrants'

export type AppUserSettings = {
  defaultEthAccount: ?string,
  permissionsChecked: boolean,
  permissionsGrants: StrictPermissionsGrants,
}

export class UserSettings extends Record({
  defaultEthAccount: (undefined: ?string),
  permissionChecked: false,
  permissionGrants: new AppPermissionsGrants(),
}) {}

export default class UsersSettings extends Record({
  records: (Map(): Map<string, UserSettings>),
}) {
  getIDs(): List<string> {
    // $FlowFixMe: record field
    return this.records.toList()
  }

  getSettings(userID: string): UserSettings {
    return this.getIn(['records', userID], new UserSettings())
  }

  setSettings(userID: string, settings: AppUserSettings): this {
    settings.permissionsGrants = createStrictPermissionGrants(
      settings.permissionsGrants,
    )
    return this.setIn(['records', userID], new UserSettings(settings))
  }

  getPermissions(userID: string): ?AppPermissionsGrants {
    const settings = this.getIn(['records', userID])
    if (settings != null) {
      return settings.permissionsGrants
    }
  }

  setPermissions(
    userID: string,
    permissions: PermissionsGrants | StrictPermissionsGrants,
    checked?: boolean,
  ): this {
    return this.updateIn(
      ['records', userID],
      new UserSettings(),
      (settings: UserSettings) => {
        return settings.withMutations(s => {
          s.set('permissionsGrants', createStrictPermissionGrants(permissions))
          if (checked != null) {
            s.set('permissionChecked', checked)
          }
        })
      },
    )
  }

  getPermission(userID: string, key: PermissionKey): ?PermissionGrant {
    return this.getIn(['records', userID, 'permissionsGrants', key])
  }

  setPermission(
    userID: string,
    key: PermissionKey,
    value: PermissionGrant,
  ): this {
    return this.setIn(['records', userID, 'permissionsGrants', key], value)
  }

  getPermissionsChecked(userID: string): boolean {
    return this.getIn(['records', userID, 'permissionsChecked'], false)
  }

  setPermissionsChecked(userID: string, checked: boolean): this {
    return this.setIn(['records', userID, 'permissionsChecked'], checked)
  }

  getDefaultEthAccount(userID: string): ?string {
    return this.getIn(['records', userID, 'defaultEthAccount'])
  }

  setDefaultEthAccount(
    userID: string,
    walletID: string,
    account: string,
  ): this {
    return this.setIn(['records', userID, 'defaultEthAccount'], account)
  }

  removeUser(userID: string): this {
    return this.deleteIn(['records', userID])
  }
}
