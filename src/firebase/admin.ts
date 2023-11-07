// const database = database.ref("stations").on(
//   "child_changed",
//   (snapshot, key) => {
//     console.log("key: ", key);
//     console.log("data: ", snapshot.val());
//   },
//   (errorObject) => {
//     console.log("The read failed: " + errorObject.name);
//   }
// );

import * as firebase from "firebase-admin";
import { App } from "firebase-admin/app";
import { Database } from "firebase-admin/database";
import { FIREBASE_CONFIG } from "./firebase.config";

const FirebaseInstance: App = firebase.initializeApp({
  credential: firebase.credential.cert(FIREBASE_CONFIG),
  databaseURL: "https://car-charging-app-e045e-default-rtdb.firebaseio.com",
});

const FirebaseDatabase: Database = firebase.database(FirebaseInstance);

export { FirebaseDatabase };
