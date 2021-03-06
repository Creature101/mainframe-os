/**
 * @flow
 * @relayHash cbf1a505ac8695dfbeaca6e34a938050
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type ContactsScreen_contacts$ref = any;
export type ContactsScreenQueryVariables = {|
  userID: string
|};
export type ContactsScreenQueryResponse = {|
  +viewer: {|
    +contacts: {|
      +$fragmentRefs: ContactsScreen_contacts$ref
    |}
  |}
|};
export type ContactsScreenQuery = {|
  variables: ContactsScreenQueryVariables,
  response: ContactsScreenQueryResponse,
|};
*/


/*
query ContactsScreenQuery(
  $userID: String!
) {
  viewer {
    contacts {
      ...ContactsScreen_contacts_3iqrP
    }
    id
  }
}

fragment ContactsScreen_contacts_3iqrP on Contacts {
  ...ContactsView_contacts_3iqrP
}

fragment ContactsView_contacts_3iqrP on Contacts {
  userContacts(userID: $userID) {
    peerID
    localID
    connectionState
    publicFeed
    profile {
      name
      ethAddress
    }
    id
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "kind": "LocalArgument",
    "name": "userID",
    "type": "String!",
    "defaultValue": null
  }
],
v1 = {
  "kind": "ScalarField",
  "alias": null,
  "name": "id",
  "args": null,
  "storageKey": null
};
return {
  "kind": "Request",
  "operationKind": "query",
  "name": "ContactsScreenQuery",
  "id": null,
  "text": "query ContactsScreenQuery(\n  $userID: String!\n) {\n  viewer {\n    contacts {\n      ...ContactsScreen_contacts_3iqrP\n    }\n    id\n  }\n}\n\nfragment ContactsScreen_contacts_3iqrP on Contacts {\n  ...ContactsView_contacts_3iqrP\n}\n\nfragment ContactsView_contacts_3iqrP on Contacts {\n  userContacts(userID: $userID) {\n    peerID\n    localID\n    connectionState\n    publicFeed\n    profile {\n      name\n      ethAddress\n    }\n    id\n  }\n}\n",
  "metadata": {},
  "fragment": {
    "kind": "Fragment",
    "name": "ContactsScreenQuery",
    "type": "Query",
    "metadata": null,
    "argumentDefinitions": v0,
    "selections": [
      {
        "kind": "LinkedField",
        "alias": null,
        "name": "viewer",
        "storageKey": null,
        "args": null,
        "concreteType": "Viewer",
        "plural": false,
        "selections": [
          {
            "kind": "LinkedField",
            "alias": null,
            "name": "contacts",
            "storageKey": null,
            "args": null,
            "concreteType": "Contacts",
            "plural": false,
            "selections": [
              {
                "kind": "FragmentSpread",
                "name": "ContactsScreen_contacts",
                "args": [
                  {
                    "kind": "Variable",
                    "name": "userID",
                    "variableName": "userID",
                    "type": null
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "operation": {
    "kind": "Operation",
    "name": "ContactsScreenQuery",
    "argumentDefinitions": v0,
    "selections": [
      {
        "kind": "LinkedField",
        "alias": null,
        "name": "viewer",
        "storageKey": null,
        "args": null,
        "concreteType": "Viewer",
        "plural": false,
        "selections": [
          {
            "kind": "LinkedField",
            "alias": null,
            "name": "contacts",
            "storageKey": null,
            "args": null,
            "concreteType": "Contacts",
            "plural": false,
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
                  },
                  v1
                ]
              }
            ]
          },
          v1
        ]
      }
    ]
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '5338a77b0109e329e2a17e138ff4f5e4';
module.exports = node;
