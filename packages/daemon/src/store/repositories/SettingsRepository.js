// @flow

import { Record } from 'immutable'

import Repository from './Repository'

export class SettingsRepositoryValue extends Record({
  bzzURL: 'http://swarm-gateways.net',
  pssURL: 'ws://localhost:8546',
  ethURL: 'https://ropsten.infura.io/KWLG1YOMaYgl4wiFlcJv',
  ethChainID: 3, // Mainnet 1, Ropsten 3, Rinkeby 4, Kovan 42, Local (ganache) 1977
}) {}

export default class SettingsRepository extends Repository<SettingsRepositoryValue> {
  constructor() {
    super(new SettingsRepositoryValue())
  }

  setBzzURL(url: string) {
    this.update(value => {
      value.set('bzzURL', url)
    })
  }

  setPssURL(url: string) {
    this.update(value => {
      value.set('pssURL', url)
    })
  }

  setEthURL(url: string) {
    this.update(value => {
      value.set('ethURL', url)
    })
  }

  setEthChainID(id: number) {
    this.update(value => {
      value.set('ethChainID', id)
    })
  }
}
