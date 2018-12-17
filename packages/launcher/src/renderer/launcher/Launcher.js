//@flow

import type {
  ID,
  AppGetAllResult as Apps,
  IdentityGetOwnUsersResult as OwnIdentities,
  WalletGetEthWalletsResult as Wallets,
  AppOwnData,
  AppInstalledData,
} from '@mainframe/client'
import {
  havePermissionsToGrant,
  type StrictPermissionsGrants,
} from '@mainframe/app-permissions'
import React, { Component, Fragment } from 'react'
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'

import { ThemeProvider as MFThemeProvider } from '@morpheus-ui/core'

import THEME from '../theme'

import type { VaultsData } from '../../types'

import colors from '../colors'
import globalStyles from '../styles'
import Text from '../UIComponents/Text'
import ModalView from '../UIComponents/ModalView'
import rpc from './rpc'
import AppInstallModal from './AppInstallModal'
import AppGridItem from './AppGridItem'
import CreateAppModal from './developer/CreateAppModal'
import IdentitySelectorView from './IdentitySelectorView'
import PermissionsView from './PermissionsView'
import OnboardView from './OnboardView'
import UnlockVaultView from './UnlockVaultView'
import SideMenu from './SideMenu'

const GRID_ITEMS_PER_ROW = 3

type State = {
  apps: Apps,
  identities: OwnIdentities,
  wallets?: Wallets,
  devMode: boolean,
  showAppInstallModal?: boolean,
  showAppCreateModal?: boolean,
  showModal: ?{
    type: 'app_create' | 'app_install' | 'select_id' | 'accept_permissions',
    data?: Object,
  },
  vaultsData?: VaultsData,
  selectIdForApp?: Object,
  appHoverByID?: string,
}

type AppData = AppOwnData | AppInstalledData

export default class App extends Component<{}, State> {
  state = {
    showModal: undefined,
    wallets: undefined,
    vaultsData: undefined,
    devMode: false,
    showAppInstallModal: false,
    identities: {
      users: [],
    },
    apps: {
      installed: [],
      own: [],
    },
  }

  componentDidMount() {
    this.getVaultsData()
  }

  getVaultsData = async () => {
    try {
      const vaultsData = await rpc.getVaultsData()
      this.setState({
        vaultsData,
      })
      if (vaultsData.vaultOpen) {
        this.getAppsAndUsers()
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err)
    }
  }

  getAppsAndUsers = async () => {
    try {
      const apps = await rpc.getApps()
      const identities = await rpc.getOwnUserIdentities()
      const wallets = await rpc.getEthWallets()
      this.setState({
        apps,
        identities,
        wallets,
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('error: ', err)
    }
  }

  // HANDLERS

  onOpenedVault = () => {
    this.getVaultsData()
  }

  onPressInstall = () => {
    this.setState({
      showModal: {
        type: 'app_install',
      },
    })
  }

  onInstallComplete = () => {
    this.onCloseModal()
    this.getAppsAndUsers()
  }

  onOpenApp = (app: AppData) => {
    this.setState({
      showModal: {
        type: 'select_id',
        data: {
          type: this.state.devMode ? 'own' : 'installed',
          app,
        },
      },
    })
  }

  onCloseModal = () => {
    this.setState({
      showModal: undefined,
    })
  }

  onSelectAppUser = async (userID: ID) => {
    const { showModal, devMode } = this.state
    if (
      showModal &&
      showModal.data &&
      showModal.data.app &&
      showModal.type === 'select_id'
    ) {
      const { app } = showModal.data
      const user = app.users.find(u => u.id === userID)
      if (
        !devMode &&
        havePermissionsToGrant(app.manifest.permissions) &&
        (!user || !user.settings.permissionsSettings.permissionsChecked)
      ) {
        // If this user hasn't used the app before
        // we need to ask to accept permissions
        const data = { ...showModal.data }
        data['userID'] = userID
        this.setState({
          showModal: {
            type: 'accept_permissions',
            data,
          },
        })
      } else {
        try {
          await rpc.launchApp(app.appID, userID)
        } catch (err) {
          // TODO: - Error feedback
        }
        this.setState({
          showModal: undefined,
        })
      }
    }
  }

  onToggleDevMode = () => {
    this.setState({
      devMode: !this.state.devMode,
    })
  }

  onPressCreate = () => {
    this.setState({
      showModal: {
        type: 'app_create',
      },
    })
  }

  onAppCreated = () => {
    this.onCloseModal()
    this.getAppsAndUsers()
  }

  onAppRemoved = () => {
    this.getAppsAndUsers()
  }

  onSubmitPermissions = async (permissionSettings: StrictPermissionsGrants) => {
    if (
      this.state.showModal &&
      this.state.showModal.type === 'accept_permissions' &&
      this.state.showModal.data
    ) {
      const { app, userID } = this.state.showModal.data
      try {
        await rpc.setAppUserPermissionsSettings(app.appID, userID, {
          grants: permissionSettings,
          permissionsChecked: true,
        })
        await this.getAppsAndUsers()
        await rpc.launchApp(app.appID, userID)
      } catch (err) {
        // TODO: - Error feedback
        // eslint-disable-next-line no-console
        console.warn(err)
      }
      this.setState({
        showModal: undefined,
      })
    }
  }

  // RENDER

  renderOnboarding() {
    return <OnboardView onboardComplete={this.getVaultsData} />
  }

  renderAppsGrid = (apps: Array<AppData>) => {
    if (!apps) {
      return null
    }
    const appRows = apps.reduce((rows, app, i) => {
      const rowIndex = Math.floor(i / GRID_ITEMS_PER_ROW)
      if (!rows[rowIndex]) {
        rows[rowIndex] = []
      }
      rows[rowIndex].push(
        <AppGridItem
          key={`item${i}`}
          app={app}
          ownApp={this.state.devMode}
          onAppRemoved={this.onAppRemoved}
          onOpenApp={this.onOpenApp}
        />,
      )
      return rows
    }, [])

    const btnTitle = this.state.devMode ? 'Create new App' : 'Install App'
    const btnStyles = [styles.installButtonText]
    const onPress = this.state.devMode
      ? this.onPressCreate
      : this.onPressInstall
    if (this.state.devMode) {
      btnStyles.push(styles.createButtonText)
    }
    const testID = this.state.devMode
      ? 'launcher-create-app-button'
      : 'launcher-install-app-button'
    const installButton = (
      <TouchableOpacity
        key="install"
        testID={testID}
        style={styles.newAppButton}
        onPress={onPress}>
        <View style={styles.installAppButton}>
          <Text style={btnStyles}>{btnTitle}</Text>
        </View>
      </TouchableOpacity>
    )

    const lastRow = appRows[appRows.length - 1]
    if (lastRow && lastRow.length < GRID_ITEMS_PER_ROW) {
      lastRow.push(installButton)
    } else {
      appRows.push([installButton])
    }

    const gridRows = appRows.map((row, i) => (
      <View key={`row${i}`} style={styles.gridRow}>
        {row}
      </View>
    ))
    return <Fragment>{gridRows}</Fragment>
  }

  renderInside() {
    if (!this.state.vaultsData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )
    }

    if (!this.state.vaultsData.defaultVault) {
      return this.renderOnboarding()
    }

    if (!this.state.vaultsData.vaultOpen) {
      return (
        <UnlockVaultView
          vaultsData={this.state.vaultsData || {}}
          onUnlockVault={this.onOpenedVault}
        />
      )
    }

    const { apps, devMode } = this.state

    const appsGrid = this.renderAppsGrid(devMode ? apps.own : apps.installed)

    let modal
    if (this.state.showModal) {
      switch (this.state.showModal.type) {
        case 'accept_permissions': {
          // $FlowFixMe ignore undefined warning
          const { app } = this.state.showModal.data
          modal = (
            <ModalView isOpen={true} onRequestClose={this.onCloseModal}>
              <Text style={globalStyles.header}>
                Permission Requested by {app.manifest.name}
              </Text>
              <PermissionsView
                permissions={app.manifest.permissions}
                onSubmit={this.onSubmitPermissions}
              />
            </ModalView>
          )
          break
        }
        case 'app_install':
          modal = (
            <AppInstallModal
              onRequestClose={this.onCloseModal}
              onInstallComplete={this.onInstallComplete}
            />
          )
          break
        case 'app_create':
          modal = (
            <CreateAppModal
              onRequestClose={this.onCloseModal}
              onAppCreated={this.onAppCreated}
            />
          )
          break
        case 'select_id':
          modal = (
            <ModalView isOpen={true} onRequestClose={this.onCloseModal}>
              <IdentitySelectorView
                enableCreate
                type="user"
                identities={this.state.identities.users}
                onSelectId={this.onSelectAppUser}
                onCreatedId={this.getAppsAndUsers}
              />
            </ModalView>
          )
          break
        default:
      }
    }

    const sideBarStyles = [styles.sideBarView]
    const appsContainerStyles = [styles.appsView]
    if (this.state.devMode) {
      sideBarStyles.push(styles.sideBarDark)
      appsContainerStyles.push(styles.appsViewDev)
    }

    return (
      <View style={styles.container} testID="launcher-view">
        <SideMenu
          devMode={this.state.devMode}
          identities={this.state.identities}
          wallets={this.state.wallets}
          onToggleDevMode={this.onToggleDevMode}
        />
        <View style={appsContainerStyles}>
          <ScrollView contentContainerStyle={styles.appsGrid}>
            {appsGrid}
          </ScrollView>
        </View>
        {modal}
      </View>
    )
  }

  render() {
    return (
      <MFThemeProvider theme={THEME}>{this.renderInside()}</MFThemeProvider>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100vh',
  },
  appsView: {
    padding: 20,
    alignItems: 'center',
    flex: 1,
  },
  appsViewDev: {
    backgroundColor: colors.DARK_BLUE_GREY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  appsGrid: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: 700,
  },
  gridRow: {
    marginTop: 20,
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  newAppButton: {
    marginHorizontal: 20,
    alignItems: 'center',
  },
  installAppButton: {
    width: 190,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.GREY_MED_81,
  },
  installButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.GREY_DARK_54,
  },
  createButtonText: {
    color: colors.LIGHT_GREY_BLUE,
  },
})
