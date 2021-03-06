// @flow

import React, { Component } from 'react'
import { ActivityIndicator } from 'react-native'
import styled from 'styled-components/native'
import { Text, Button } from '@morpheus-ui/core'
import { graphql, createFragmentContainer, commitMutation } from 'react-relay'
import type { StrictPermissionsRequirements } from '@mainframe/app-permissions'
import { shell } from 'electron'

import colors from '../../colors'
import rpc from '../rpc'
import { EnvironmentContext } from '../RelayEnvironment'
import applyContext, { type CurrentUser } from '../LauncherContext'
import ModalView from '../../UIComponents/ModalView'
import AppIcon from '../apps/AppIcon'

import EditAppDetailsModal, {
  type CompleteAppData,
} from './EditAppDetailsModal'

import PermissionsRequirementsView from './PermissionsRequirements'
import AppSummary from './AppSummary'

export type OwnApp = {
  name: string,
  localID: string,
  mfid: string,
  contentsPath: ?string,
  updateFeedHash: ?string,
  developer: {
    id: string,
    name: string,
  },
  versions: Array<{
    version: string,
    versionHash: ?string,
    permissions: StrictPermissionsRequirements,
  }>,
}

type Props = {
  ownApp: OwnApp,
  onClose: () => void,
  user: CurrentUser,
}

type State = {
  errorMsg?: ?string,
  publishing?: ?boolean,
  showModal?: ?'confirm_permissions' | 'app_summary' | 'edit_details',
  selectedVersionIndex: number,
}

const Container = styled.View`
  flex: 1;
  width: 100%;
  flex-direction: row;
`

const Header = styled.View`
  flex-direction: row;
  width: 100%;
  padding-left: 15px;
  align-items: center;
`

const HeaderLabels = styled.View`
  margin-left: 16px;
`

const IconContainer = styled.View`
  width: 40px;
  height: 40px;
  background-color: #232323;
  border-radius: 5px;
`

const VersionsContainer = styled.View`
  width: 280;
  border-right-width: 1px;
  border-color: ${colors.LIGHT_GREY_E8};
`

const VersionRow = styled.View`
  margin: 5px;
  padding-vertical: 15px;
  padding-horizontal: 10px;
  background-color: ${props =>
    props.selected ? colors.LIGHT_GREY_E5 : 'transparent'};
`

const VersionDetailContainer = styled.View`
  padding-vertical: 25px;
  padding-horizontal: 35px;
  flex: 1;
`

const VersionDetailRow = styled.View`
  margin-bottom: 20px;
`

const ButtonsContainer = styled.View`
  margin-top: 10px;
  flex-direction: row;
`

const ErrorView = styled.View`
  padding-vertical: 15px;
`

const detailTextStyle = { color: colors.GREY_DARK_38, paddingTop: 5 }

const publishVersionMutation = graphql`
  mutation OwnAppDetailViewPublishAppVersionMutation(
    $input: PublishAppVersionInput!
  ) {
    publishAppVersion(input: $input) {
      versionHash
      viewer {
        apps {
          ...OwnAppsView_apps
        }
      }
    }
  }
`

const updateAppDetailsMutation = graphql`
  mutation OwnAppDetailViewUpdateAppDetailsMutation(
    $input: UpdateAppDetailsInput!
  ) {
    updateAppDetails(input: $input) {
      viewer {
        apps {
          ...OwnAppsView_apps
        }
      }
    }
  }
`

const setAppPermissionsRequirementsMutation = graphql`
  mutation OwnAppDetailViewSetAppPermissionsRequirementsMutation(
    $input: SetAppPermissionsRequirementsInput!
  ) {
    setAppPermissionsRequirements(input: $input) {
      viewer {
        apps {
          ...OwnAppsView_apps
        }
      }
    }
  }
`

class OwnAppDetailView extends Component<Props, State> {
  static contextType = EnvironmentContext

  constructor(props: Props) {
    super(props)
    this.state = {
      selectedVersionIndex: 0, // Currently only supporting a single version
    }
  }

  get selectedVersion() {
    return this.props.ownApp.versions[this.state.selectedVersionIndex]
  }

  // HANDLERS

  onPressPublishVersion = () => {
    this.setState({
      showModal: 'confirm_permissions',
    })
  }

  onUpdateAppData = (appData: CompleteAppData) => {
    const { ownApp } = this.props
    const input = {
      appID: ownApp.localID,
      version: appData.version,
      name: appData.name,
      contentsPath: appData.contentsPath,
    }

    this.setState({
      showModal: undefined,
    })
    commitMutation(this.context, {
      mutation: updateAppDetailsMutation,
      variables: { input },
      onCompleted: (res, errors) => {
        let errorMsg
        if (errors) {
          errorMsg = errors.length ? errors[0].message : 'Error Updating app.'
        }
        this.setState({
          errorMsg,
        })
      },
      onError: err => {
        this.setState({
          errorMsg: err.message,
        })
      },
    })
  }

  publishApp = () => {
    const { ownApp } = this.props
    const input = {
      appID: ownApp.localID,
      version: this.selectedVersion.version,
    }

    this.setState({
      publishing: true,
      showModal: undefined,
    })

    commitMutation(this.context, {
      mutation: publishVersionMutation,
      variables: { input },
      onCompleted: (res, errors) => {
        let errorMsg
        if (errors) {
          errorMsg = errors.length ? errors[0].message : 'Error publishing app.'
        }
        this.setState({
          publishing: false,
          errorMsg,
        })
      },
      onError: err => {
        this.setState({
          publishing: false,
          errorMsg: err.message,
        })
      },
    })
  }

  onPressSubmitFoReview = () => {
    shell.openExternal('https://docs.mainframe.com/docs/mft')
  }

  onPressEdit = () => {
    this.setState({
      showModal: 'edit_details',
    })
  }

  onPressOpenApp = async () => {
    const { user, ownApp } = this.props
    try {
      await rpc.launchApp(ownApp.localID, user.localID)
    } catch (err) {
      this.setState({
        errorMsg: err.message,
      })
    }
  }

  onCloseModal = () => {
    this.setState({
      showModal: undefined,
    })
  }

  onSetPermissions = (requirements: StrictPermissionsRequirements) => {
    const { ownApp } = this.props
    const input = {
      permissionsRequirements: requirements,
      appID: ownApp.localID,
    }
    commitMutation(this.context, {
      mutation: setAppPermissionsRequirementsMutation,
      // $FlowFixMe permission key
      variables: { input },
      onCompleted: (res, errors) => {
        if (errors) {
          const errorMsg = errors.length
            ? errors[0].message
            : 'Error updating permissions settings.'
          this.setState({
            errorMsg,
            showModal: undefined,
          })
        } else {
          this.setState({
            showModal: 'app_summary',
          })
        }
      },
      onError: err => {
        this.setState({
          errorMsg: err.message,
          showModal: undefined,
        })
      },
    })
  }

  // RENDER

  renderVersions() {
    const versions = this.props.ownApp.versions.map(v => {
      const selected = v.version === this.selectedVersion.version
      return (
        <VersionRow selected={selected} key={v.version}>
          <Text variant="greyDark">Version {v.version}</Text>
        </VersionRow>
      )
    })
    return <VersionsContainer>{versions}</VersionsContainer>
  }

  renderVersionDetail() {
    const { ownApp } = this.props
    const details = (
      <>
        <VersionDetailRow>
          <Text variant="smallLabel">APP NAME</Text>
          <Text theme={detailTextStyle}>{ownApp.name}</Text>
        </VersionDetailRow>
        <VersionDetailRow>
          <Text variant="smallLabel">VERSION</Text>
          <Text theme={detailTextStyle}>{this.selectedVersion.version}</Text>
        </VersionDetailRow>
      </>
    )
    let publishedState
    if (!this.selectedVersion.versionHash) {
      const actions = this.state.publishing ? (
        <ActivityIndicator />
      ) : (
        <ButtonsContainer>
          <Button
            title="OPEN"
            variant={['mediumUppercase', 'marginRight10']}
            onPress={this.onPressOpenApp}
          />
          <Button
            title="EDIT"
            variant={['mediumUppercase', 'marginRight10']}
            onPress={this.onPressEdit}
          />
          <Button
            variant={['mediumUppercase', 'red']}
            title="PUBLISH APP"
            onPress={this.onPressPublishVersion}
          />
        </ButtonsContainer>
      )
      publishedState = (
        <>
          <VersionDetailRow>
            <Text variant="smallLabel">CONTENT PATH</Text>
            <Text theme={detailTextStyle}>{ownApp.contentsPath}</Text>
          </VersionDetailRow>
          {actions}
        </>
      )
    } else {
      publishedState = (
        <>
          <ButtonsContainer>
            <Button
              title="OPEN"
              variant={['mediumUppercase', 'marginRight10']}
              onPress={this.onPressOpenApp}
            />
            <Button
              variant={['mediumUppercase', 'red']}
              title="SUBMIT TO MAINRAME APP STORE"
              onPress={this.onPressSubmitFoReview}
            />
          </ButtonsContainer>
        </>
      )
    }

    const errorView = this.state.errorMsg ? (
      <ErrorView>
        <Text variant="error">{this.state.errorMsg}</Text>
      </ErrorView>
    ) : null
    return (
      <VersionDetailContainer>
        {details}
        {publishedState}
        {errorView}
      </VersionDetailContainer>
    )
  }

  render() {
    const { ownApp } = this.props

    const appData = {
      name: ownApp.name,
      contentsPath: ownApp.contentsPath,
      version: this.selectedVersion.version,
    }

    switch (this.state.showModal) {
      case 'confirm_permissions':
        return (
          <PermissionsRequirementsView
            permissionRequirements={this.selectedVersion.permissions}
            onSetPermissions={this.onSetPermissions}
            onRequestClose={this.onCloseModal}
          />
        )
      case 'app_summary': {
        return (
          <AppSummary
            appData={appData}
            permissionsRequirements={this.selectedVersion.permissions}
            onPressBack={this.onPressPublishVersion}
            onRequestClose={this.onCloseModal}
            onPressSave={this.publishApp}
            submitButtonTitle="PUBLISH"
          />
        )
      }
      case 'edit_details':
        return (
          <EditAppDetailsModal
            submitButtonTitle="SAVE"
            onRequestClose={this.onCloseModal}
            onSetAppData={this.onUpdateAppData}
            appData={appData}
          />
        )
      default:
    }

    const updateHash = ownApp.updateFeedHash && (
      <Text variant="greyMed" size={12}>
        App ID: {ownApp.updateFeedHash}
      </Text>
    )

    const header = (
      <Header>
        <IconContainer>
          <AppIcon size="small" id={ownApp.mfid} />
        </IconContainer>
        <HeaderLabels>
          <Text variant={['mediumTitle', 'darkBlue']}>{ownApp.name}</Text>
          {updateHash}
        </HeaderLabels>
      </Header>
    )
    return (
      <ModalView
        title={ownApp.name}
        headerView={header}
        onRequestClose={this.props.onClose}>
        <Container>
          {this.renderVersions()}
          {this.renderVersionDetail()}
        </Container>
      </ModalView>
    )
  }
}

const OwnAppDetailViewWithContext = applyContext(OwnAppDetailView)

export default createFragmentContainer(OwnAppDetailViewWithContext, {
  ownApp: graphql`
    fragment OwnAppDetailView_ownApp on OwnApp {
      localID
      mfid
      name
      contentsPath
      updateFeedHash
      developer {
        id
        name
      }
      versions {
        version
        versionHash
        permissions {
          optional {
            WEB_REQUEST
            BLOCKCHAIN_SEND
            COMMS_CONTACT
            CONTACTS_READ
          }
          required {
            WEB_REQUEST
            BLOCKCHAIN_SEND
            COMMS_CONTACT
            CONTACTS_READ
          }
        }
      }
    }
  `,
})
