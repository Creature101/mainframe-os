// @flow

import { Record } from 'immutable'

import PermissionsRequirements from './PermissionsRequirements'

export class ManifestAuthor extends Record({
  id: '',
}) {}

export default class Manifest extends Record({
  id: '',
  author: (undefined: ?ManifestAuthor),
  name: '',
  version: '',
  contentsURI: '',
  permissions: (undefined: ?PermissionsRequirements),
}) {
  constructor(data: Object) {
    super({
      id: data.id,
      author: new ManifestAuthor(data.author),
      name: data.name,
      version: data.version,
      contentsURI: data.contentsURI,
      permissions: new PermissionsRequirements(data.permissions),
    })
  }
}
