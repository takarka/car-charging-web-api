import * as firebase from "firebase-admin";
import { App } from "firebase-admin/app";
import { Database } from "firebase-admin/database";
import { FIREBASE_CONFIG } from "./firebase.config";
import {
  stationStateChanges,
} from "./services/station-watch.service";

const FirebaseInstance: App = firebase.initializeApp({
  credential: firebase.credential.cert(FIREBASE_CONFIG),
  databaseURL: "https://car-charging-app-e045e-default-rtdb.firebaseio.com",
});

const FirebaseDatabase: Database = firebase.database(FirebaseInstance);
stationStateChanges();
// stationDeviceGetOrderStopOrStart();

export { FirebaseDatabase };
