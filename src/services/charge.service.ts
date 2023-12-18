import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { FirebaseDatabase } from "../firebase/admin";
import {
  STATIONS,
  STATIONS_INFO,
  UNIQUE_IDS,
  USERS,
} from "../firebase/db-ref-name";
import {
  IStation,
  IStationHistory,
  IStationInfo
} from "../models/stations.model";
import { IUser, IUserAccountChargeHistory } from "../models/user.model";

dayjs.extend(utc);

export async function startCharging(
  userId: string,
  stationId: string,
  cost: number
): Promise<any | null> {
  const dateNow = dayjs().utc().toISOString();

  try {
    if (!userId || !stationId || !cost) {
      throw new Error(`Requered fields does not exist!`);
    }
    const stationsRef = FirebaseDatabase.ref(STATIONS).child(stationId);
    const stationsSnapshot = await stationsRef.once("value");
    const station: IStation = stationsSnapshot.val();
    if (station == null) {
      throw new Error(`Station ${stationId} does not exist!`);
    }
    if (station.isCharging) {
      // is station is active
      throw new Error(`Station ${stationId} is busy`);
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

    const userRef = FirebaseDatabase.ref(USERS + "/" + userId);
    const userSnapshot = await userRef.once("value");
    const user: IUser = userSnapshot.val();
    if (user == null) {
      // is station is active
      throw new Error(`User ${userId}  not found!`);
    }

    if (!user.accountBalance || user.accountBalance < cost) {
      // is station is active
      throw new Error(`User ${userId} does not have enough money!`);
    }

    // GENERATE NEW ID FOR HISTORY
    const newHistoryId = await FirebaseDatabase.ref(UNIQUE_IDS).push().key;
    if (!newHistoryId) {
      throw new Error(`New history ID can not generated!`);
    }

    const stationsInfoWhoUsesTransaction = await stationsInfoRef
      .child("whoUses")
      .transaction((currentData) => {
        if (currentData == null) {
          return {
            id: newHistoryId,
            price: stationInfo.price,
            power: stationInfo.power,
            cost: cost,
            date: dateNow,
            user: {
              firstName: user.firstName,
              phoneNumber: user.phoneNumber,
            },
          } as IStationHistory;
        }
        // Abort the transaction.
        return;
      });

    if (!stationsInfoWhoUsesTransaction?.committed) {
      //
      throw new Error(
        `Station ${stationId} is used by another user! (transaction)`
      );
    }

    // ADD accountHistory to User
    const userAccountHistoryRef = userRef
      .child("accountHistories")
      .child(newHistoryId);
    await userAccountHistoryRef.set({
      station: {
        id: stationId,
        name: stationInfo.name,
        address: stationInfo.address,
        price: stationInfo.price,
        power: stationInfo.power,
      },
      sum: cost,
      date: dateNow,
      type: "charge",
      isFinished: false,
    } as IUserAccountChargeHistory);

    // Write off the user’s balance
    await userRef
      .child("accountBalance")
      .set(eval(`${user.accountBalance} - ${cost}`));

    // start charging at this STATION
    await stationsRef.child("changeToWake/changeMe").set(1);
    // await stationsRef.child("isCharging").set(true);

    return true;
  } catch (error) {
    throw error;
  }
}

export async function stopCharging(
  userId: string,
  stationId: string
): Promise<any | null> {
  try {
    if (!userId || !stationId) {
      throw new Error(`Requered fields does not exist!`);
    }
    const stationsRef = FirebaseDatabase.ref(STATIONS + "/" + stationId);
    const stationsSnapshot = await stationsRef.once("value");
    const station: IStation = stationsSnapshot.val();
    if (station == null) {
      throw new Error(`Station ${stationId} does not exist!`);
    }
    if (!station.isCharging) {
      // is station is active
      throw new Error(`Station ${stationId} is not charging!`);
    }

    const stationsInfoRef = FirebaseDatabase.ref(
      STATIONS_INFO + "/" + stationId
    );
    const stationsInfoSnapshot = await stationsInfoRef.once("value");
    const stationInfo: IStationInfo = stationsInfoSnapshot.val();
    if (stationInfo == null) {
      throw new Error(`Station Info ${stationId} does not exist!`);
    }
    if (stationInfo.whoUses == null) {
      throw new Error(`Station ${stationId} is not used by anyone!`);
    }
    if (
      stationInfo.whoUses.user?.phoneNumber == null ||
      stationInfo.whoUses.user.phoneNumber != userId
    ) {
      throw new Error(
        `This station ${stationId} was started by another user! `
      );
    }

    // const factChargedPower = station?.power ?? 0;
    // const planChargedPower = amountOfPower(
    //   stationInfo.whoUses.price,
    //   stationInfo.whoUses.cost
    // );

    // if(factChargedPower < planChargedPower){
    //   // amountOfCost
    // }

    await stationsInfoRef.child("stationHistories").push(stationInfo.whoUses);
    await stationsInfoRef.child("whoUses").remove();

    // STOP charging at this STATION
    await stationsRef.child("changeToWake/changeMe").set(0);
    // await stationsRef.child("isCharging").set(false);

    // Update user account history
    const userRef = FirebaseDatabase.ref(USERS + "/" + userId);
    const userAccountHistoryRef = await userRef
      .child("accountHistories")
      .child(stationInfo.whoUses.id);

    const userAccountHistorySnopshot = await userAccountHistoryRef.once(
      "value"
    );
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
        type: "charge",
        isFinished: true,
      } as IUserAccountChargeHistory);
    } else {
      userAccountHistoryRef.child("isFinished").set(true);
    }

    return true;
  } catch (error) {
    throw error;
  }
}
