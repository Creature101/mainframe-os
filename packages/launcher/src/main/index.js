// @flow

import os from 'os'
import path from 'path'
import url from 'url'
import crypto from 'crypto'
import * as fs from 'fs-extra'
// eslint-disable-next-line import/named
import Client from '@mainframe/client'
import {
  Environment,
  DaemonConfig,
  VaultConfig,
  SwarmConfig,
} from '@mainframe/config'
import StreamRPC from '@mainframe/rpc-stream'
import {
  createKeyStore,
  setupDaemon,
  startDaemon,
  startSwarm,
} from '@mainframe/toolbox'
// eslint-disable-next-line import/named
import { app, BrowserWindow, ipcMain } from 'electron'
import { is } from 'electron-util'

import keytar from 'keytar'
import { APP_TRUSTED_REQUEST_CHANNEL } from '../constants'
import type { AppSession } from '../types'

import { AppContext, LauncherContext } from './contexts'
import { interceptWebRequests } from './permissions'
import createElectronTransport from './createElectronTransport'
import createRPCChannels from './rpc/createChannels'

const DAEMON_BIN_PATH = is.development
  ? path.resolve(__dirname, '../../../daemon/bin/run')
  : `${process.resourcesPath}/bin/mainframed`
const SWARM_BIN_PATH = is.development
  ? 'swarm'
  : `${process.resourcesPath}/bin/swarm`

const homedir = os.homedir()
const SWARM_DATADIR = `${homedir}${path.sep}.mainframe${path.sep}swarm`
const SWARM_PASSWORD_FILE = `${SWARM_DATADIR}${path.sep}password`
const SWARM_PASSWORD_SERVICE = 'com.mainframe.services.swarm'
const SWARM_PASSWORD_ACCOUNT = 'mainframe'

const envType =
  process.env.NODE_ENV === 'production' ? 'production' : 'development'
const envName =
  process.env.MAINFRAME_ENV || Environment.getDefault() || `launcher-${envType}`
// Get existing env or create with specified type
const env = Environment.get(envName, envType)

// eslint-disable-next-line no-console
console.log(`using environment "${env.name}" (${env.type})`)

const daemonConfig = new DaemonConfig(env)
const vaultConfig = new VaultConfig(env)
const swarmConfig = new SwarmConfig(env)

let client
let launcherWindow

type AppContexts = { [appID: string]: { [userID: string]: AppContext } }

const appContexts: AppContexts = {}
const contextsByWindow: WeakMap<BrowserWindow, AppContext> = new WeakMap()

const newWindow = (params: Object = {}) => {
  const window = new BrowserWindow({
    width: params.width || 800,
    height: params.height || 600,
    show: false,
    titleBarStyle: 'hidden',
  })

  if (is.development) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  } else {
    const formattedUrl = url.format({
      pathname: path.join(__dirname, `index.html`),
      protocol: 'file:',
      slashes: true,
    })
    window.loadURL(formattedUrl)
  }
  return window
}

// App Lifecycle

const launchApp = async (appSession: AppSession) => {
  const appID = appSession.app.appID
  const userID = appSession.user.id
  const appOpen = appContexts[appID] && appContexts[appID][userID]
  if (appOpen) {
    const appWindow = appContexts[appID][userID].window
    if (appWindow.isMinimized()) {
      appWindow.restore()
    }
    appWindow.show()
    appWindow.focus()
    return
  }

  const appWindow = newWindow()
  if (appSession.isDev) {
    appWindow.webContents.on('did-attach-webview', () => {
      // Open a separate developer tools window for the app
      appWindow.webContents.executeJavaScript(
        `document.getElementById('sandbox-webview').openDevTools()`,
      )
    })
  }
  appWindow.on('closed', async () => {
    await client.app.close({ sessID: appSession.session.sessID })
    const ctx = contextsByWindow.get(appWindow)
    if (ctx != null) {
      await ctx.clear()
      contextsByWindow.delete(appWindow)
    }
    delete appContexts[appID][userID]
  })

  const appContext = new AppContext({
    appSession,
    client,
    trustedRPC: new StreamRPC(
      createElectronTransport(appWindow, APP_TRUSTED_REQUEST_CHANNEL),
    ),
    window: appWindow,
  })
  contextsByWindow.set(appWindow, appContext)
  appWindow.webContents.on('did-attach-webview', (event, webContents) => {
    interceptWebRequests(appContext, webContents.session)
  })

  if (appContexts[appID]) {
    appContexts[appID][userID] = appContext
  } else {
    // $FlowFixMe: can't assign ID type
    appContexts[appID] = { [userID]: appContext }
  }
}

const getSwarmKeystorePassword = async (): Promise<string> => {
  let password = await keytar.getPassword(
    SWARM_PASSWORD_SERVICE,
    SWARM_PASSWORD_ACCOUNT,
  )
  if (password == null) {
    password = crypto.randomBytes(48).toString('hex')
    await keytar.setPassword(
      SWARM_PASSWORD_SERVICE,
      SWARM_PASSWORD_ACCOUNT,
      password,
    )
    try {
      await fs.ensureDir(SWARM_DATADIR)
      await fs.writeFile(SWARM_PASSWORD_FILE, password)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('error writing password', err)
    }
  }
  return password
}

const setupClient = async () => {
  // First launch flow: initial setup
  if (daemonConfig.binPath == null) {
    // Get or create password for Swarm node
    const password = await getSwarmKeystorePassword()
    await createKeyStore(password)
    // Configure Swarm
    swarmConfig.binPath = SWARM_BIN_PATH
    swarmConfig.socketPath = 'ws://localhost:8546'
    // Setup daemon
    await setupDaemon(daemonConfig, {
      binPath: DAEMON_BIN_PATH,
      socketPath: env.createSocketPath('mainframe.ipc'),
    })
  }

  // Start Swarm
  try {
    await startSwarm(swarmConfig)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Failed to start Swarm:', e)
  }

  // Start daemon and connect local client to it
  if (daemonConfig.runStatus !== 'running') {
    daemonConfig.runStatus = 'stopped'
  }
  await startDaemon(daemonConfig, true)
  daemonConfig.runStatus = 'running'
  client = new Client(daemonConfig.socketPath)

  // Simple check for API call, not proper versioning logic
  const version = await client.apiVersion()
  if (version !== 0.1) {
    throw new Error('Unexpected API version')
  }
}

const createLauncherWindow = async () => {
  await setupClient()

  launcherWindow = newWindow({ width: 900, height: 600 })

  const launcherContext = new LauncherContext({
    client,
    launchApp,
    vaultConfig,
    window: launcherWindow,
  })
  createRPCChannels(launcherContext, contextsByWindow)

  // Emitted when the window is closed.
  launcherWindow.on('closed', async () => {
    // TODO: fix below to not error on close
    // const keys = Object.keys(appWindows)
    // Object.keys(appWindows).forEach(w => {
    //   appWindows[w].close()
    // })
    await launcherContext.clear()
    launcherWindow = null
  })
}

app.on('ready', createLauncherWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (launcherWindow === null) {
    createLauncherWindow()
  }
})

// Window lifecycle events

ipcMain.on('init-window', event => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window === launcherWindow) {
    window.webContents.send('start', { type: 'launcher' })
  } else {
    const appContext = contextsByWindow.get(window)
    if (appContext != null) {
      window.webContents.send('start', {
        type: 'app',
        appSession: appContext.appSession,
        partition: `persist:${appContext.appSession.app.appID}/${
          appContext.appSession.user.id
        }`,
      })
    }
  }
})

ipcMain.on('ready-window', event => {
  BrowserWindow.fromWebContents(event.sender).show()
})
