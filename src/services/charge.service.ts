import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { FirebaseDatabase } from "../firebase/admin";
import { STATIONS, STATIONS_INFO, USERS } from "../firebase/db-ref-name";
import {
  IStation,
  IStationHistory,
  IStationInfo,
  StationType,
} from "../models/stations.model";
import { IUser } from "../models/user.model";

dayjs.extend(utc);

export async function startCharging(
  userId: string,
  stationId: string,
  cost: number
): Promise<any | null> {
  const dateNow = dayjs().utc().toISOString()

  try {
    if (!userId || !stationId || !cost) {
      throw new Error(`Requered fields does not exist!`);
    }
    const stationsRef = FirebaseDatabase.ref(STATIONS + "/" + stationId);
    const stationsSnapshot = await stationsRef.once("value");
    const station: IStation = stationsSnapshot.val();
    if (station == null) {
      throw new Error(`Station ${stationId} does not exist!`);
    }
    if (
      station.changeToWake?.changeMe != null &&
      station.changeToWake.changeMe === 1
    ) {
      // is station is active
      throw new Error(`Station ${stationId} is busy`);
    }

    const userRef = FirebaseDatabase.ref(USERS + "/" + userId);
    const userSnapshot = await userRef.once("value");
    const user: IUser = userSnapshot.val();
    if (!user.accountBalance || user.accountBalance < cost) {
      // is station is active
      throw new Error(`User ${userId} does not have enough money!`);
    }

    const stationsInfoRef = FirebaseDatabase.ref(
      STATIONS_INFO + "/" + stationId
    );
    const stationsInfoSnapshot = await stationsInfoRef.once("value");
    const stationInfo: IStationInfo = stationsInfoSnapshot.val();
    if (stationInfo == null) {
      throw new Error(`Station Info ${stationId} does not exist!`);
    }
    if (stationInfo.whoUses) {
      throw new Error(`Station ${stationId} is used by another user!`);
    }

    // // ADD accountHistory to USER
    // const userAccountHistoryRef = userRef.child("accountHistories");
    // await userAccountHistoryRef.push({
    //   station: stationInfo,
    //   sum: cost,
    //   date: dateNow,
    //   type: "charge",
    // } as IUserAccountChargeHistory);

    // Write off the user’s balance
    await userRef
      .child("accountBalance")
      .set(eval(`${user.accountBalance} - ${cost}`));

    // mark as this station is used by this user
    await stationsInfoRef.child("whoUses").transaction(
      (currentData: IStationHistory) => {
        if (currentData === null) {
          return {
            price: stationInfo.price,
            power: stationInfo.power,
            cost: cost,
            date: dateNow,
            user: { phoneNumber: user.phoneNumber, firstName: user.firstName },
          } as IStationHistory;
        } else {
          throw new Error(`Station ${stationId} is used by another user!`);
          // Abort the transaction.
        }
      },
      (error, committed, snapshot) => {
        if (error) {
          console.log("whoUses Transaction failed abnormally!", error);
          // throw error;
        } else if (!committed) {
          console.log(
            "whoUses We aborted the transaction (because ada already exists)."
          );
          // throw error;
        } else {
          console.log("whoUses added!");
        }
        console.log("stationsInfoRef data: ", snapshot?.val());
      }
    );

    // // add history to station
    // await stationsInfoRef.child("stationHistories").push({
    //   price: stationInfo.price,
    //   power: stationInfo.power,
    //   cost: cost,
    //   date: dateNow,
    //   user: { phoneNumber: user.phoneNumber, firstName: user.firstName },
    // } as IStationHistory);

    // start charging at this STATION
    await stationsRef.child("changeToWake/changeMe").transaction(
      (currentData: StationType) => {
        if (currentData !== 1) {
          return 1;
        } else {
          throw new Error(`Station ${stationId} is already running!`);
          // Abort the transaction.
        }
      },
      (error, committed, snapshot) => {
        if (error) {
          console.log("changeMe Transaction failed abnormally!", error);
          // throw error;
        } else if (!committed) {
          console.log(
            "changeMe We aborted the transaction (because ada already exists)."
          );
          // throw error;
        } else {
          console.log("changeMe!");
        }
        console.log("stationsRef data: ", snapshot?.val());
      }
    );

    return true;
  } catch (error) {
    throw error;
  }
}
