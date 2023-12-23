import dayjs from "dayjs";
import { Reference } from "firebase-admin/database";
import { IStation, IStationInfo } from "../../models/stations.model";
import { IUserAccountChargeHistory } from "../../models/user.model";
import { FirebaseDatabase } from "../admin";
import { STATIONS, STATIONS_INFO, USERS } from "../db-ref-name";
import { IStationChargeState } from "./../../models/stations.model";

export async function stationStateChanges() {
  try {
    const stationsRef = FirebaseDatabase.ref(STATIONS);
    const stationsSnapshot = await stationsRef.once("value");
    const stationsValue: IStation[] = stationsSnapshot.val();

    for (const [stationId, station] of Object.entries(stationsValue)) {
      stationsRef
        .child(stationId)
        .child("isCharging")
        .on("value", async (snapshot) => {
          const isCharging = snapshot.val();
          if (isCharging) {
            setTimerToStopCharging(stationId, stationsRef);
            return;
          }
          stopStationCharging(stationId);

          if (station.changeToWake.changeMe == 1) {
            await stationsRef
              .child(stationId)
              .child("changeToWake/changeMe")
              .set(0);
          }
        });
    }
  } catch (error) {
    // Something wents wrong
  }
}

// stop charging when the station send isCharging = false
async function stopStationCharging(stationId: string, stationsRef?: Reference) {
  const stationsInfoRef = FirebaseDatabase.ref(STATIONS_INFO + "/" + stationId);
  const stationsInfoSnapshot = await stationsInfoRef.once("value");
  const stationInfo: IStationInfo = stationsInfoSnapshot.val();

  if (stationInfo?.whoUses == null) {
    return;
  }

  stationInfo.whoUses.completionDate = dayjs().utc().toISOString();

  await stationsInfoRef.child("stationHistories").push(stationInfo.whoUses);
  await stationsInfoRef.child("whoUses").remove();

  // Update user account history
  const userId = stationInfo.whoUses.user?.phoneNumber;
  if (userId == null) {
    return;
  }
  const userRef = FirebaseDatabase.ref(USERS + "/" + userId);
  const userAccountHistoryRef = await userRef
    .child("accountHistories")
    .child(stationInfo.whoUses.id);

  const userAccountHistorySnopshot = await userAccountHistoryRef.once("value");
  if (!userAccountHistorySnopshot.exists()) {
    // throw an error
    userAccountHistoryRef.set({
      station: {
        id: stationId,
        name: stationInfo.name,
        address: stationInfo.address,
        price: stationInfo.whoUses.price,
        power: stationInfo.whoUses.power,
      },
      sum: stationInfo.whoUses.cost,
      date: stationInfo.whoUses.date,
      completionDate: stationInfo.whoUses.completionDate,
      type: "charge",
      isFinished: true,
    } as IUserAccountChargeHistory);
  } else {
    userAccountHistoryRef.child("isFinished").set(true);
    userAccountHistoryRef
      .child("completionDate")
      .set(stationInfo.whoUses.completionDate);
  }
}

// stop charging when time is up
async function setTimerToStopCharging(
  stationId: string,
  stationsRef: Reference
) {
  const stationsInfoRef = FirebaseDatabase.ref(STATIONS_INFO + "/" + stationId);
  const stationsInfoSnapshot = await stationsInfoRef.once("value");
  const stationInfo: IStationInfo = stationsInfoSnapshot.val();

  if (stationInfo?.whoUses == null) {
    return;
  }

  const stopTimeInMlSeconds = dayjs(stationInfo.whoUses.completionDate).diff(
    stationInfo.whoUses.date,
    "millisecond"
  );

  setTimeout(() => {
    stationsRef.child(stationId).child("changeToWake/changeMe").set(0);
  }, stopTimeInMlSeconds);
}

// Simylation of station device
export async function stationDeviceGetOrderStopOrStart() {
  try {
    const stationsRef = FirebaseDatabase.ref(STATIONS);
    const stationsSnapshot = await stationsRef.once("value");
    const stationsValue: IStation[] = stationsSnapshot.val();

    for (const [stationId, value] of Object.entries(stationsValue)) {
      stationsRef
        .child(stationId)
        .child("changeToWake")
        .on("value", async (snapshot) => {
          const chargeState: IStationChargeState = snapshot.val();
          if (chargeState.changeMe == 1) {
            // START charging
            console.log("START charging: ", stationId);
            await stationsRef.child(stationId).child("isCharging").set(true);
            return;
          }

          if (chargeState.changeMe == 0) {
            // STOP charging
            console.log("STOP charging: ", stationId);
            await stationsRef.child(stationId).child("isCharging").set(false);
            return;
          }
        });
    }
  } catch (error) {
    // Something wents wrong
  }
}
