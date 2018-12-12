// @flow

import { readEncryptedFile, writeEncryptedFile } from '@mainframe/secure-file'
import {
  decodeBase64,
  encodeBase64,
  type base64,
} from '@mainframe/utils-base64'
import {
  PASSWORDHASH_ALG_ARGON2ID13,
  PASSWORDHASH_MEMLIMIT_SENSITIVE,
  PASSWORDHASH_OPSLIMIT_SENSITIVE,
  createPasswordHashSalt,
  createSecretBoxKeyFromPassword,
} from '@mainframe/utils-crypto'

type VaultKDF = {
  algorithm: number,
  memlimit: number,
  opslimit: number,
  salt: base64,
}

type VaultMetadata = {
  version: 1,
  kdf: VaultKDF,
}

type VaultKeyParams = {
  key: Buffer,
  kdf: VaultKDF,
}

class VaultFile {
  _path: string
  _keyParams: VaultKeyParams

  constructor(path: string, keyParams: VaultKeyParams) {
    this._path = path
    this._keyParams = keyParams
  }

  async write(data: Object = {}): Promise<void> {
    const contents = Buffer.from(JSON.stringify(data))
    return writeEncryptedFile(this._path, contents, this._keyParams.key, {
      version: 1,
      kdf: this._keyParams.kdf,
    })
  }
}

export const createVaultKeyParams = async (
  password: Buffer,
  options?: Object = {},
): Promise<VaultKeyParams> => {
  const salt = createPasswordHashSalt()
  const kdf = {
    algorithm: PASSWORDHASH_ALG_ARGON2ID13,
    memlimit: PASSWORDHASH_MEMLIMIT_SENSITIVE,
    opslimit: PASSWORDHASH_OPSLIMIT_SENSITIVE,
    ...options,
    salt: encodeBase64(salt),
  }
  const key = await createSecretBoxKeyFromPassword(
    password,
    salt,
    kdf.opslimit,
    kdf.memlimit,
    kdf.algorithm,
  )
  return { kdf, key }
}

export const createVaultFile = async (
  path: string,
  password: Buffer,
  options?: Object,
) => {
  const keyParams = await createVaultKeyParams(password, options)
  const vault = new VaultFile(path, keyParams)
  await vault.write()
  return vault
}

export const openVaultFile = async (
  path: string,
  password: Buffer,
): Promise<{ data: Object, vault: VaultFile }> => {
  let keyParams
  const file = await readEncryptedFile(path, async (meta: ?VaultMetadata) => {
    if (meta == null) {
      throw new Error('Missing metadata')
    }
    if (meta.version !== 1) {
      throw new Error('Invalid vault format version')
    }
    if (meta.kdf == null) {
      throw new Error('Missing KDF parameters in metadata')
    }

    const key = await createSecretBoxKeyFromPassword(
      password,
      decodeBase64(meta.kdf.salt),
      meta.kdf.opslimit,
      meta.kdf.memlimit,
      meta.kdf.algorithm,
    )
    keyParams = { key, kdf: meta.kdf }

    return key
  })

  if (file.opened == null) {
    throw new Error('Invalid password')
  }
  if (keyParams == null) {
    throw new Error('Invalid file')
  }

  return {
    data: JSON.parse(file.opened.toString()),
    vault: new VaultFile(path, keyParams),
  }
}
