/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteFragment } from 'relay-runtime';
export type ConnectionState = "CONNECTED" | "SENDING" | "SENT" | "%future added value";
import type { FragmentReference } from "relay-runtime";
declare export opaque type ContactsView_contacts$ref: FragmentReference;
export type ContactsView_contacts = {|
  +userContacts: ?$ReadOnlyArray<?{|
    +peerID: string,
    +localID: string,
    +connectionState: ConnectionState,
    +publicFeed: string,
    +profile: {|
      +name: ?string,
      +ethAddress: ?string,
    |},
  |}>,
  +$refType: ContactsView_contacts$ref,
|};
*/


const node/*: ConcreteFragment*/ = {
  "kind": "Fragment",
  "name": "ContactsView_contacts",
  "type": "Contacts",
  "metadata": null,
  "argumentDefinitions": [
    {
      "kind": "LocalArgument",
      "name": "userID",
      "type": "String!",
      "defaultValue": null
    }
  ],
  "selections": [
    {
      "kind": "LinkedField",
      "alias": null,
      "name": "userContacts",
      "storageKey": null,
      "args": [
        {
          "kind": "Variable",
          "name": "userID",
          "variableName": "userID",
          "type": "String!"
        }
      ],
      "concreteType": "Contact",
      "plural": true,
      "selections": [
        {
          "kind": "ScalarField",
          "alias": null,
          "name": "peerID",
          "args": null,
          "storageKey": null
        },
        {
          "kind": "ScalarField",
          "alias": null,
          "name": "localID",
          "args": null,
          "storageKey": null
        },
        {
          "kind": "ScalarField",
          "alias": null,
          "name": "connectionState",
          "args": null,
          "storageKey": null
        },
        {
          "kind": "ScalarField",
          "alias": null,
          "name": "publicFeed",
          "args": null,
          "storageKey": null
        },
        {
          "kind": "LinkedField",
          "alias": null,
          "name": "profile",
          "storageKey": null,
          "args": null,
          "concreteType": "GenericProfile",
          "plural": false,
          "selections": [
            {
              "kind": "ScalarField",
              "alias": null,
              "name": "name",
              "args": null,
              "storageKey": null
            },
            {
              "kind": "ScalarField",
              "alias": null,
              "name": "ethAddress",
              "args": null,
              "storageKey": null
            }
          ]
        }
      ]
    }
  ]
};
// prettier-ignore
(node/*: any*/).hash = '8d6ca7412949eb13461ff37d5b19c437';
module.exports = node;
