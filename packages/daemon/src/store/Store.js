// @flow

import { AppsRepository, SettingsRepository } from './repositories'

export default class Store {
  apps = new AppsRepository()
  settings = new SettingsRepository()

  // TODO: add entities relations handler and vault setup
  // mutations logic also here?
}
