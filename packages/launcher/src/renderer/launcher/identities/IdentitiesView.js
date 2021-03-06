// @flow

import React, { Component } from 'react'
import { createFragmentContainer, graphql } from 'react-relay'
import styled from 'styled-components/native'
import type { AppInstalledData } from '@mainframe/client'

import { Text, Button } from '@morpheus-ui/core'

import Avatar from '../../UIComponents/Avatar'
import IdentityEditModal from './IdentityEditModal'

export type User = {
  localID: string,
  feedHash: string,
  discoverable?: boolean,
  profile: {
    name: string,
  },
  apps: Array<AppInstalledData>,
}

export type Identities = {
  ownUsers: Array<User>,
  ownDevelopers: Array<User>,
}

type Props = {
  identities: Identities,
}

type State = {
  editUser?: ?User,
}

const Container = styled.View`
  flex: 1;
`

const UserItem = styled.View`
  margin-bottom: 10px;
  padding: 30px 25px;
  background-color: ${props => props.theme.colors.LIGHT_GREY_F9};
  border-left-width: 5px;
  border-left-style: solid;
  border-left-color: ${props => props.theme.colors.PRIMARY_BLUE};
  border-radius: 3px;
  flex-direction: row;
  align-items: center;
`

const Profile = styled.View`
  flex: 1;
  margin-left: 15px;
`

const InfoBox = styled.View`
  padding: 10px;
  background-color: ${props => props.theme.colors.PRIMARY_LIGHT_BLUE};
  border-radius: 3px;
`

class IdentitiesView extends Component<Props, State> {
  state = {}

  openEditModal = (user: User) => {
    this.setState({
      editUser: user,
    })
  }

  closeModal = () => this.setState({ editUser: null })

  renderUser(user: User, hideEdit?: boolean) {
    const onPress = () => this.openEditModal(user)
    return (
      <UserItem key={user.localID}>
        <Avatar size="medium" id={user.localID} />
        <Profile>
          <Text variant="bold">{user.profile.name}</Text>
          {user.feedHash ? (
            <Text theme={{ color: '#585858', fontSize: '11px' }}>
              Contact ID: {user.feedHash}
            </Text>
          ) : null}
        </Profile>
        {!hideEdit && (
          <Button
            onPress={onPress}
            variant={['small', 'completeOnboarding']}
            title="EDIT"
          />
        )}
      </UserItem>
    )
  }

  renderModal() {
    return this.state.editUser ? (
      <IdentityEditModal
        onClose={this.closeModal}
        ownUserIdentity={this.state.editUser}
      />
    ) : null
  }

  render() {
    return (
      <Container>
        {this.props.identities.ownDevelopers.length > 0 && (
          <Text variant={['smallTitle', 'blue', 'bold']}>Personal</Text>
        )}
        {this.renderUser(this.props.identities.ownUsers[0])}
        <InfoBox>
          <Text theme={{ color: '#ffffff' }}>
            Share your Contact ID with your contacts so they can add you on
            Mainframe.
          </Text>
        </InfoBox>
        {this.props.identities.ownDevelopers.length > 0 && (
          <>
            <Text variant={['smallTitle', 'blue', 'bold']}>Developer</Text>
            {this.renderUser(this.props.identities.ownDevelopers[0], true)}
          </>
        )}
        {this.renderModal()}
      </Container>
    )
  }
}

export default createFragmentContainer(IdentitiesView, {
  identities: graphql`
    fragment IdentitiesView_identities on Identities {
      ownUsers {
        ...IdentityEditModal_ownUserIdentity
        localID
        feedHash
        profile {
          name
        }
        apps {
          localID
          manifest {
            name
          }
          users {
            settings {
              permissionsSettings {
                permissionsChecked
                grants {
                  BLOCKCHAIN_SEND
                }
              }
            }
          }
        }
      }
      ownDevelopers {
        localID
        profile {
          name
        }
      }
    }
  `,
})
