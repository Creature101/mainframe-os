// @flow

import os from 'os'
import * as path from 'path'
import type { SwarmConfig } from '@mainframe/config'
import keythereum from 'keythereum'
import * as fs from 'fs-extra'
import execa from 'execa'

import { onDataMatch } from './utils'

export type KeyObject = {
  address: string,
  Crypto: {
    cipher: string,
    ciphertext: string,
    cipherparams: {
      iv: string,
    },
    mac: string,
    kdf: string,
    kdfparams: {
      c: number,
      dklen: number,
      prf: string,
      salt: string,
    },
  },
  id: string,
  version: number,
}

let proc

const homedir = os.homedir()
const datadir = path.join(homedir, '.mainframe', 'swarm')
const passwordFile = path.join(datadir, 'password')
const keystorePath = path.join(datadir, 'keystore')

export const createKeyStore = async (password: string): Promise<string> => {
  const params = { keyBytes: 32, ivBytes: 16 }
  const dk = keythereum.create(params)
  const kdf = 'pbkdf2'

  const options = {
    kdf: kdf,
    cipher: 'aes-128-ctr',
    kdfparams: {
      c: 262144,
      dklen: 32,
      prf: 'hmac-sha256',
    },
  }
  const keyObject = keythereum.dump(
    password,
    dk.privateKey,
    dk.salt,
    dk.iv,
    options,
  )
  await fs.ensureDir(keystorePath)
  await keythereum.exportToFile(keyObject, keystorePath)
  return keyObject.address
}

export const importKeyStore = async (address: string): Promise<KeyObject> => {
  return keythereum.importFromFile(address, datadir)
}

export const getPrivateKey = async (
  address: string,
  password: string,
  encoding?: string = 'hex',
): Promise<string> => {
  const keyObject = keythereum.importFromFile(address, datadir)
  const keyBuffer = await keythereum.recover(password, keyObject)
  return keyBuffer.toString(encoding)
}

export const listKeyStores = async (): Promise<KeyObject[]> => {
  fs.ensureDir(datadir)
  let i = 0
  let keyObjects = []
  const keystores = await fs.readdir(keystorePath)
  if (keystores.length >= 1) {
    keyObjects = []
    for (i = 0; i < keystores.length; ++i) {
      const address = keystores[i].substr(keystores[i].length - 40)
      const keyObject = await importKeyStore(address)
      keyObjects.push(keyObject)
    }
  }
  return keyObjects
}

export const listKeyStorePaths = async (): Promise<KeyObject[]> => {
  fs.ensureDir(datadir)
  const keystores = await fs.readdir(keystorePath)
  return keystores
}

export const startSwarm = (config: SwarmConfig): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const keystores = await listKeyStores()
    const keystore = keystores[0]

    proc = execa(config.binPath, [
      '--datadir',
      datadir,
      '--password',
      passwordFile,
      '--bzzaccount',
      keystore.address,
      '--verbosity',
      '4',
      '--bootnodes',
      'enode://ee9a5a571ea6c8a59f9a8bb2c569c865e922b41c91d09b942e8c1d4dd2e1725bd2c26149da14de1f6321a2c6fdf1e07c503c3e093fb61696daebf74d6acd916b@54.186.219.160:30399',
      '--ws',
      '--wsorigins',
      '*',
      '--ens-api',
      'https://mainnet.infura.io/55HkPWVAJQjGH4ucvfW9',
    ])

    await fs.ensureDir(`${datadir}${path.sep}logs`)

    proc.stderr.pipe(
      fs.createWriteStream(`${datadir}${path.sep}logs${path.sep}swarm.log`),
    )

    const stopOut = onDataMatch(proc.stdout, 'fatal:', err => {
      stopOut()
      reject(new Error(`Swarm error: ${err}`))
    })

    const stopErr = onDataMatch(
      proc.stderr,
      'websocket endpoint opened',
      () => {
        stopErr()
        config.runStatus = 'running'
        resolve()
      },
    )
  })
}

export const stopSwarm = () => {
  return proc
    ? new Promise(resolve => {
        proc.once('exit', resolve)
        proc.kill()
        proc = undefined
      })
    : Promise.resolve()
}
