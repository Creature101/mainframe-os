// @flow

import {
  createWebRequestGrant,
  havePermissionsToGrant,
  mergeGrantsToDetails,
  type PermissionsDetails,
  type PermissionGrant,
  type PermissionKey,
  type PermissionsGrants,
  PERMISSION_KEYS_BOOLEAN,
  type StrictPermissionsGrants,
} from '@mainframe/app-permissions'
import { Record } from 'immutable'

import Manifest from './Manifest'
import UsersSettings, { type AppUserSettings } from './UsersSettings'

export type AppInstallationState =
  | 'pending'
  | 'hash_lookup'
  | 'hash_not_found'
  | 'downloading'
  | 'download_error'
  | 'ready'

export type SessionData = {
  appID: string,
  userID: string,
  permissions: PermissionsDetails,
}

export default class PeerApp extends Record({
  id: '',
  installationState: ('pending': AppInstallationState),
  manifest: (undefined: ?Manifest),
  users: (undefined: ?UsersSettings),
}) {
  // TODO: type
  static fromJSON = (data: Object): PeerApp => new PeerApp(data)

  constructor(data: Object) {
    super({
      id: data.id,
      installationState: data.installationState,
      manifest: new Manifest(data.manifest),
      users: new UsersSettings(data.users),
    })
  }

  setInstallationState(state: AppInstallationState): this {
    return this.set('installationState', state)
  }

  setSettings(userID: string, settings: AppUserSettings): this {
    return this.update('users', (users: UsersSettings) => {
      return users.setSettings(userID, settings)
    })
  }

  setPermissions(
    userID: string,
    permissions: PermissionsGrants | StrictPermissionsGrants,
    checked?: boolean,
  ): this {
    return this.update('users', (users: UsersSettings) => {
      return users.setPermissions(userID, permissions, checked)
    })
  }

  setPermission(
    userID: string,
    key: PermissionKey,
    value: PermissionGrant,
  ): this {
    return this.update('users', (users: UsersSettings) => {
      return users.setPermission(userID, key, value)
    })
  }

  setPermissionsChecked(userID: string, checked: boolean): this {
    return this.update('users', (users: UsersSettings) => {
      return users.setPermissionsChecked(userID, checked)
    })
  }

  setDefaultEthAccount(
    userID: string,
    walletID: string,
    account: string,
  ): this {
    return this.update('users', (users: UsersSettings) => {
      return users.setDefaultEthAccount(userID, walletID, account)
    })
  }

  removeUser(userID: string): this {
    return this.update('users', (users: UsersSettings) => {
      return users.removeUser(userID)
    })
  }

  hasCheckedPermissions(userID: string): boolean {
    // $FlowFixMe: record field
    if (!havePermissionsToGrant(this.manifest.permissions.toJSON())) {
      return true
    }
    // $FlowFixMe: record field
    return this.users.getPermissionsChecked(userID)
  }

  createSession(userID: string): SessionData {
    if (!this.hasCheckedPermissions(userID)) {
      throw new Error('Permissions need to be checked by user')
    }

    // $FlowFixMe: record field
    const requiredPermissions = this.manifest.permissions.required.toJSON()
    const allManifestPermissions = {
      // $FlowFixMe: record field
      ...this.manifest.permissions.required.toJSON(),
      // $FlowFixMe: record field
      ...this.manifest.permissions.optional.toJSON(),
    }

    const appPermissions = {
      ...requiredPermissions,
      WEB_REQUEST: createWebRequestGrant(requiredPermissions.WEB_REQUEST),
    }
    // $FlowFixMe: record field
    const userPermissions: StrictPermissionsGrants = this.users.getPermissions(
      userID,
    ) || {
      WEB_REQUEST: createWebRequestGrant(),
    }

    PERMISSION_KEYS_BOOLEAN.forEach(key => {
      // Any keys not present in the manifest we set to false (deny)
      if (!allManifestPermissions[key]) {
        userPermissions[key] = false
      }
    })

    return {
      // $FlowFixMe: record field
      appID: this.id,
      userID,
      permissions: mergeGrantsToDetails(appPermissions, userPermissions),
    }
  }
}
