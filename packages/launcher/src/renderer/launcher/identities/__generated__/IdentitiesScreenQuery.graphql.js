/**
 * @flow
 * @relayHash 57e92abfb00d75f37fa7db711101fe55
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type IdentitiesScreen_identities$ref = any;
export type IdentitiesScreenQueryVariables = {||};
export type IdentitiesScreenQueryResponse = {|
  +viewer: {|
    +identities: {|
      +$fragmentRefs: IdentitiesScreen_identities$ref
    |}
  |}
|};
export type IdentitiesScreenQuery = {|
  variables: IdentitiesScreenQueryVariables,
  response: IdentitiesScreenQueryResponse,
|};
*/


/*
query IdentitiesScreenQuery {
  viewer {
    identities {
      ...IdentitiesScreen_identities
    }
    id
  }
}

fragment IdentitiesScreen_identities on Identities {
  ...IdentitiesView_identities
}

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
        id
      }
      id
    }
    id
  }
  ownDevelopers {
    localID
    profile {
      name
    }
    id
  }
}

fragment IdentityEditModal_ownUserIdentity on OwnUserIdentity {
  localID
  feedHash
  privateProfile
  profile {
    name
    avatar
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = {
  "kind": "ScalarField",
  "alias": null,
  "name": "localID",
  "args": null,
  "storageKey": null
},
v1 = {
  "kind": "ScalarField",
  "alias": null,
  "name": "name",
  "args": null,
  "storageKey": null
},
v2 = [
  v1
],
v3 = {
  "kind": "ScalarField",
  "alias": null,
  "name": "id",
  "args": null,
  "storageKey": null
};
return {
  "kind": "Request",
  "operationKind": "query",
  "name": "IdentitiesScreenQuery",
  "id": null,
  "text": "query IdentitiesScreenQuery {\n  viewer {\n    identities {\n      ...IdentitiesScreen_identities\n    }\n    id\n  }\n}\n\nfragment IdentitiesScreen_identities on Identities {\n  ...IdentitiesView_identities\n}\n\nfragment IdentitiesView_identities on Identities {\n  ownUsers {\n    ...IdentityEditModal_ownUserIdentity\n    localID\n    feedHash\n    profile {\n      name\n    }\n    apps {\n      localID\n      manifest {\n        name\n      }\n      users {\n        settings {\n          permissionsSettings {\n            permissionsChecked\n            grants {\n              BLOCKCHAIN_SEND\n            }\n          }\n        }\n        id\n      }\n      id\n    }\n    id\n  }\n  ownDevelopers {\n    localID\n    profile {\n      name\n    }\n    id\n  }\n}\n\nfragment IdentityEditModal_ownUserIdentity on OwnUserIdentity {\n  localID\n  feedHash\n  privateProfile\n  profile {\n    name\n    avatar\n  }\n}\n",
  "metadata": {},
  "fragment": {
    "kind": "Fragment",
    "name": "IdentitiesScreenQuery",
    "type": "Query",
    "metadata": null,
    "argumentDefinitions": [],
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
            "name": "identities",
            "storageKey": null,
            "args": null,
            "concreteType": "Identities",
            "plural": false,
            "selections": [
              {
                "kind": "FragmentSpread",
                "name": "IdentitiesScreen_identities",
                "args": null
              }
            ]
          }
        ]
      }
    ]
  },
  "operation": {
    "kind": "Operation",
    "name": "IdentitiesScreenQuery",
    "argumentDefinitions": [],
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
            "name": "identities",
            "storageKey": null,
            "args": null,
            "concreteType": "Identities",
            "plural": false,
            "selections": [
              {
                "kind": "LinkedField",
                "alias": null,
                "name": "ownUsers",
                "storageKey": null,
                "args": null,
                "concreteType": "OwnUserIdentity",
                "plural": true,
                "selections": [
                  v0,
                  {
                    "kind": "ScalarField",
                    "alias": null,
                    "name": "feedHash",
                    "args": null,
                    "storageKey": null
                  },
                  {
                    "kind": "ScalarField",
                    "alias": null,
                    "name": "privateProfile",
                    "args": null,
                    "storageKey": null
                  },
                  {
                    "kind": "LinkedField",
                    "alias": null,
                    "name": "profile",
                    "storageKey": null,
                    "args": null,
                    "concreteType": "NamedProfile",
                    "plural": false,
                    "selections": [
                      v1,
                      {
                        "kind": "ScalarField",
                        "alias": null,
                        "name": "avatar",
                        "args": null,
                        "storageKey": null
                      }
                    ]
                  },
                  {
                    "kind": "LinkedField",
                    "alias": null,
                    "name": "apps",
                    "storageKey": null,
                    "args": null,
                    "concreteType": "App",
                    "plural": true,
                    "selections": [
                      v0,
                      {
                        "kind": "LinkedField",
                        "alias": null,
                        "name": "manifest",
                        "storageKey": null,
                        "args": null,
                        "concreteType": "AppManifestData",
                        "plural": false,
                        "selections": v2
                      },
                      {
                        "kind": "LinkedField",
                        "alias": null,
                        "name": "users",
                        "storageKey": null,
                        "args": null,
                        "concreteType": "AppUser",
                        "plural": true,
                        "selections": [
                          {
                            "kind": "LinkedField",
                            "alias": null,
                            "name": "settings",
                            "storageKey": null,
                            "args": null,
                            "concreteType": "AppUserSettings",
                            "plural": false,
                            "selections": [
                              {
                                "kind": "LinkedField",
                                "alias": null,
                                "name": "permissionsSettings",
                                "storageKey": null,
                                "args": null,
                                "concreteType": "AppPermissionsSettings",
                                "plural": false,
                                "selections": [
                                  {
                                    "kind": "ScalarField",
                                    "alias": null,
                                    "name": "permissionsChecked",
                                    "args": null,
                                    "storageKey": null
                                  },
                                  {
                                    "kind": "LinkedField",
                                    "alias": null,
                                    "name": "grants",
                                    "storageKey": null,
                                    "args": null,
                                    "concreteType": "AppPermissions",
                                    "plural": false,
                                    "selections": [
                                      {
                                        "kind": "ScalarField",
                                        "alias": null,
                                        "name": "BLOCKCHAIN_SEND",
                                        "args": null,
                                        "storageKey": null
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          v3
                        ]
                      },
                      v3
                    ]
                  },
                  v3
                ]
              },
              {
                "kind": "LinkedField",
                "alias": null,
                "name": "ownDevelopers",
                "storageKey": null,
                "args": null,
                "concreteType": "OwnDeveloperIdentity",
                "plural": true,
                "selections": [
                  v0,
                  {
                    "kind": "LinkedField",
                    "alias": null,
                    "name": "profile",
                    "storageKey": null,
                    "args": null,
                    "concreteType": "NamedProfile",
                    "plural": false,
                    "selections": v2
                  },
                  v3
                ]
              }
            ]
          },
          v3
        ]
      }
    ]
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '2857eb4b1910aab25f5af1dcc054e75b';
module.exports = node;
