// @flow

import { createReadStream } from 'fs'
import getStream from 'get-stream'
import { pick } from 'lodash'
import crypto from 'crypto'
import {
  LOCAL_ID_SCHEMA,
  type BlockchainWeb3SendParams,
  type ContactsGetUserContactsResult,
  type WalletGetEthWalletsResult,
} from '@mainframe/client'
import { DecryptStream } from '@mainframe/utils-crypto'
import { dialog } from 'electron'
import type { Subscription as RxSubscription } from 'rxjs'
import * as mime from 'mime'
import { type AppContext, ContextSubscription } from '../contexts'
import { withPermission } from '../permissions'
import { PrependInitializationVector, Decrypt } from '../storage'

class CommsSubscription extends ContextSubscription<RxSubscription> {
  constructor() {
    super('comms_subscription')
  }

  async dispose() {
    if (this.data != null) {
      this.data.unsubscribe()
    }
  }
}

const sharedMethods = {
  wallet_getEthAccounts: async (ctx: AppContext): Promise<Array<string>> => {
    // $FlowFixMe indexer property
    const accounts = await ctx.client.wallet.getUserEthAccounts({
      userID: ctx.appSession.user.localID,
    })
    if (
      ctx.appSession.defaultEthAccount &&
      accounts.includes(ctx.appSession.defaultEthAccount)
    ) {
      // Move default account to top
      const defaultAccount = ctx.appSession.defaultEthAccount
      accounts.splice(accounts.indexOf(defaultAccount), 1)
      accounts.unshift(defaultAccount)
    }
    return accounts
  },
}

export const sandboxed = {
  ...sharedMethods,

  api_version: (ctx: AppContext) => ctx.client.apiVersion(),

  // Blockchain

  blockchain_web3Send: async (
    ctx: AppContext,
    params: BlockchainWeb3SendParams,
  ): Promise<Object> => {
    return ctx.client.blockchain.web3Send(params)
  },

  // Wallet

  wallet_signTx: withPermission(
    'BLOCKCHAIN_SEND',
    (ctx: AppContext, params: any) => ctx.client.wallet.signTransaction(params),
    // TODO notify app if using ledger to feedback awaiting sign
  ),

  // Comms

  comms_publish: withPermission(
    'COMMS_CONTACT',
    async (
      ctx: AppContext,
      params: { contactID: string, key: string, value: Object },
    ): Promise<void> => {
      const appID = ctx.appSession.app.appID
      const userID = ctx.appSession.user.id
      return ctx.client.comms.publish({ ...params, appID, userID })
    },
  ),

  comms_subscribe: withPermission(
    'COMMS_CONTACT',
    async (
      ctx: AppContext,
      params: { contactID: string, key: string },
    ): Promise<string> => {
      const appID = ctx.appSession.app.appID
      const userID = ctx.appSession.user.id
      const subscription = await ctx.client.comms.subscribe({
        ...params,
        appID,
        userID,
      })
      const sub = new CommsSubscription()
      sub.data = subscription.subscribe(msg => {
        ctx.notifySandboxed(sub.id, msg)
      })
      ctx.setSubscription(sub)
      return sub.id
    },
  ),

  comms_getSubscribable: withPermission(
    'COMMS_CONTACT',
    async (
      ctx: AppContext,
      params: { contactID: string },
    ): Promise<Array<string>> => {
      const appID = ctx.appSession.app.appID
      const userID = ctx.appSession.user.id
      return ctx.client.comms.getSubscribable({ ...params, appID, userID })
    },
  ),

  // Contacts

  contacts_select: withPermission(
    'CONTACTS_READ',
    async (ctx: AppContext, params: { multi?: boolean }) => {
      const res = await ctx.trustedRPC.request('user_request', {
        key: 'CONTACTS_SELECT',
        params: { CONTACTS_SELECT: params },
      })
      if (!res.granted || !res || !res.data || !res.data.selectedContactIDs) {
        return { contacts: [] }
      }
      const userID = ctx.appSession.user.id
      const appID = ctx.appSession.app.appID
      const contactIDs = res.data.selectedContactIDs
      const contactsToApprove = contactIDs.map(id => ({
        localID: id,
        publicDataOnly: true, // TODO allow user to set only public data
      }))
      const {
        approvedContacts,
      } = await ctx.client.contacts.approveContactsForApp({
        appID,
        userID,
        contactsToApprove,
      })
      const ids = approvedContacts.map(c => c.id)

      const contactsRes = await ctx.client.contacts.getAppUserContacts({
        appID,
        userID,
        contactIDs: ids,
      })
      return contactsRes.contacts
    },
  ),

  contacts_getData: withPermission(
    'CONTACTS_READ',
    async (ctx: AppContext, params: { contactIDs: Array<string> }) => {
      const userID = ctx.appSession.user.id
      const appID = ctx.appSession.app.appID
      const contactsRes = await ctx.client.contacts.getAppUserContacts({
        appID,
        userID,
        contactIDs: params.contactIDs,
      })
      return contactsRes.contacts
    },
  ),

  contacts_getApproved: withPermission(
    'CONTACTS_READ',
    async (ctx: AppContext) => {
      const userID = ctx.appSession.user.id
      const appID = ctx.appSession.app.appID
      const contactsRes = await ctx.client.contacts.getAppApprovedContacts({
        appID,
        userID,
      })
      return contactsRes.contacts
    },
  ),

  storage_promptUpload: {
    params: {
      name: 'string',
    },
    handler: (ctx: AppContext, params: { name: string }): Promise<?string> => {
      console.log('storage_promptUpload called')
      return new Promise((resolve, reject) => {
        dialog.showOpenDialog(
          ctx.window,
          { title: 'Select file to upload', buttonLabel: 'Upload' },
          async filePaths => {
            if (filePaths.length !== 0) {
              try {
                const filePath = filePaths[0]
                let { address, encryptionKey, feedHash } = ctx.storage

                // TODO: move out encryption code to a separate file
                const iv = crypto.randomBytes(16) // TODO: use a constant for the length of the IV
                const cipher = crypto.createCipheriv(
                  'aes256',
                  encryptionKey,
                  iv,
                )
                const stream = createReadStream(filePath)
                  .pipe(cipher)
                  .pipe(new PrependInitializationVector(iv))

                let feedMetadata
                let dataHash
                let manifestHash

                console.log(params, 'params')
                console.log(filePaths, 'filePaths')
                console.log(mime.getType(filePath), 'mime.getType(filePath)')
                console.log(feedHash, 'feedHash')

                if (feedHash) {
                  console.log(`feedHash is ${feedHash}`)
                  const contentHash = await ctx.bzz.getFeedValue(feedHash, {}, { mode: 'content-hash' })
                  console.log(contentHash, 'contentHash')
                  ctx.storage.contentHash = contentHash
                  manifestHash = contentHash
                } else {
                  console.log('feedHash does not exist')
                  feedHash = await ctx.bzz.createFeedManifest(address)
                  const manifest = {entries: []}
                  const initialManifest = await ctx.bzz.uploadFile(JSON.stringify(manifest), {})
                  console.log(initialManifest, 'initialManifest')
                  manifestHash = initialManifest
                }

                // TODO: paralelize getting feed metadata and uploading files
                dataHash = await ctx.bzz.uploadFileStream(stream, {
                  contentType: mime.getType(filePath),
                  path: params.name,
                  manifestHash: manifestHash
                })

                console.log(dataHash, 'dataHash')

                feedMetadata = await ctx.bzz.getFeedMetadata(feedHash)
                console.log(feedMetadata, 'feedMetadata')
                console.log(manifestHash, 'manifestHash')

                await ctx.bzz.postFeedValue(feedMetadata, `0x${dataHash}`)

                ctx.storage.feedHash = feedHash
                await ctx.client.app.setFeedHash({ sessID: ctx.appSession.session.sessID, feedHash: feedHash })
                resolve(params.name)
              } catch (error) {
                console.log(error, 'storage_promptUpload error')
                // TODO: use RPCError to provide a custom error code
                reject(new Error('Upload failed'))
              }
            } else {
              // No file selected
              resolve()
            }
          },
        )
      })
    },
  },


  storage_list: {
    handler: async(ctx: AppContext): Promise<Array<string>> => {
      console.log('storage list called')
      try {
        let entries = []
        const feedHash = ctx.appSession.storage.feedHash
        console.log(feedHash, 'feedHash - storage_list')
        if (feedHash) {
          let contentHash = ctx.storage.contentHash
          console.log(contentHash, 'contentHash - storage_list')
          if (!contentHash) {
            console.log('bzz.getFeedValue called')
            contentHash = await ctx.bzz.getFeedValue(feedHash, {}, { mode: 'content-hash' })
            console.log(`contentHash is ${contentHash}`)
          }
          ctx.storage.contentHash = contentHash
          console.log('bzz.list called')
          const list = await ctx.bzz.list(contentHash)
          console.log(list, 'list')
          if (list) {
            entries = list.entries.map(meta => pick(meta, ['contentType', 'path']))
          }
        }
        return entries
      } catch (error) {
        console.log(error, 'storage_list error')
        // TODO: use RPCError to provide a custom error code
        new Error('Upload failed')
      }
      return {}
    },
  },

  storage_set: {
    params: {
      data: 'string',
      name: 'string'
    },
    handler: async(ctx: AppContext, params: { data: string, name: string }): Promise<?string> => {
      console.log('storage_set called')
      try {
        const filePath = params.name
        let { encryptionKey, feedHash } = ctx.storage

        // TODO: move out encryption code to a separate file
        const iv = crypto.randomBytes(16) // TODO: use a constant for the length of the IV
        const cipher = crypto.createCipheriv(
          'aes256',
          encryptionKey,
          iv,
        )
        const Readable = require('stream').Readable
        const dataStream = new Readable()
        // dataStream._read = () => {} // redundant? see update below
        dataStream.push(params.data)
        dataStream.push(null)

        const stream = dataStream
          .pipe(cipher)
          .pipe(new PrependInitializationVector(iv))

        console.log(dataStream, 'dataStream - storage_set')
        console.log(stream, 'stream - storage_set')

        let feedMetadata
        let dataHash
        let manifestHash

        console.log(params, 'params')
        console.log(feedHash, 'feedHash')

        if (feedHash) {
          console.log(`feedHash is ${feedHash}`)
          const contentHash = await ctx.bzz.getFeedValue(feedHash, {}, { mode: 'content-hash' })
          console.log(contentHash, 'contentHash')
          ctx.storage.contentHash = contentHash
          manifestHash = contentHash
        } else {
          console.log('feedHash does not exist')
          feedHash = await ctx.bzz.createFeedManifest(address)
          const manifest = {entries: []}
          const initialManifest = await ctx.bzz.uploadFile(JSON.stringify(manifest), {})
          console.log(initialManifest, 'initialManifest')
          manifestHash = initialManifest
        }


        dataHash = await ctx.bzz.uploadFileStream(stream, {
          contentType: 'text/plain',
          path: params.name,
          manifestHash: manifestHash
        })

        console.log(dataHash, 'dataHash')

        feedMetadata = await ctx.bzz.getFeedMetadata(feedHash)
        console.log(feedMetadata, 'feedMetadata')
        console.log(manifestHash, 'manifestHash')

        await ctx.bzz.postFeedValue(feedMetadata, `0x${dataHash}`)

        ctx.storage.feedHash = feedHash
        await ctx.client.app.setFeedHash({ sessID: ctx.appSession.session.sessID, feedHash: feedHash })
        return params.name
      } catch (error) {
        console.log(error, 'storage_set error')
        // TODO: use RPCError to provide a custom error code
        reject(new Error('Upload failed'))
      }
    },
  },

  storage_get: {
    params: {
      name: 'string'
    },
    handler: async(ctx: AppContext, params: { name: string }): Promise<?string> => {
      console.log('storage_get called')
      console.log(params, 'storage_get params')
      console.log(ctx.storage, 'ctx.storage')
      try {
        const filePath = params.name
        let { encryptionKey, feedHash } = ctx.storage

        const res = await ctx.bzz.download(`${ctx.storage.feedHash}/${filePath}`)
        const stream = res.body.pipe(new Decrypt(ctx.storage.encryptionKey))
        const data = await getStream(stream)
        console.log(data, 'storage_get data')
        return data
      } catch (error) {
        console.log(error, 'storage_get error')
        // TODO: use RPCError to provide a custom error code
        reject(new Error('Upload failed'))
      }
    },
  }
}

export const trusted = {
  ...sharedMethods,

  sub_createPermissionDenied: (ctx: AppContext): { id: string } => ({
    id: ctx.createPermissionDeniedSubscription(),
  }),
  sub_unsubscribe: {
    params: {
      id: LOCAL_ID_SCHEMA,
    },
    handler: (ctx: AppContext, params: { id: string }): void => {
      ctx.removeSubscription(params.id)
    },
  },

  blockchain_web3Send: async (
    ctx: AppContext,
    params: BlockchainWeb3SendParams,
  ): Promise<Object> => {
    return ctx.client.blockchain.web3Send(params)
  },

  wallet_getUserEthWallets: async (
    ctx: AppContext,
  ): Promise<WalletGetEthWalletsResult> => {
    return ctx.client.wallet.getUserEthWallets({
      userID: ctx.appSession.user.localID,
    })
  },

  wallet_selectDefault: async (
    ctx: AppContext,
  ): Promise<{ address: ?string }> => {
    const res = await ctx.trustedRPC.request('user_request', {
      key: 'WALLET_ACCOUNT_SELECT',
      params: {},
    })
    let address
    if (res.data && res.data.address) {
      address = res.data.address
      ctx.appSession.defaultEthAccount = res.data.address
      const userID = ctx.appSession.user.id
      const appID = ctx.appSession.app.appID
      await ctx.client.app.setUserDefaultWallet({
        userID,
        appID,
        address,
      })
    }
    return { address }
  },

  contacts_getUserContacts: (
    ctx: AppContext,
    params: { userID: string },
  ): Promise<ContactsGetUserContactsResult> => {
    return ctx.client.contacts.getUserContacts(params)
  },
}
