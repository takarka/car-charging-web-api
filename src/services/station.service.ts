import { FirebaseDatabase } from "../firebase/admin";
import { STATIONS, STATIONS_INFO, USERS } from "../firebase/db-ref-name";
import { IStation, IStationInfo } from "../models/stations.model";
import { IUser } from "../models/user.model";

export async function stations(): Promise<IStationInfo[]> {
  try {
    const stationsRef = FirebaseDatabase.ref(STATIONS);
    const stationsInfoRef = FirebaseDatabase.ref(STATIONS_INFO);
    const stationsSnapshot = await stationsRef.once("value");
    const stationsInfoSnapshot = await stationsInfoRef.once("value");

    const stationsValue: IStation[] = stationsSnapshot.val();
    const result: IStationInfo[] = [];
    for (const [key, value] of Object.entries(
      stationsInfoSnapshot.val() ?? {}
    )) {
      const station: IStationInfo = value as IStationInfo;
      station.id = key;
      station.isCharging = isStationCharging(key, stationsValue);
      result.push(station);
    }
    return result;
  } catch (error) {
    throw error;
  }
}

function isStationCharging(id: string, stationValue: any): boolean {
  return stationValue != null && stationValue[id]
    ? (stationValue[id] as IStation).isCharging
    : false;
}

export async function stationById(
  stationId: string,
  userId: string
): Promise<IStationInfo> {
  try {
    if (!stationId || !userId) {
      throw new Error(`Requered fields does not exist!`);
    }
    const userRef = FirebaseDatabase.ref(USERS + "/" + userId);
    const stationsRef = FirebaseDatabase.ref(STATIONS + "/" + stationId);
    const stationsInfoRef = FirebaseDatabase.ref(
      STATIONS_INFO + "/" + stationId
    );

    const userSnapshot = await userRef.once("value");
    const stationsSnapshot = await stationsRef.once("value");
    const stationsInfoSnapshot = await stationsInfoRef.once("value");

    const user: IUser = userSnapshot.val();
    const station: IStation = stationsSnapshot.val();
    const stationInfo: IStation = stationsInfoSnapshot.val();

    if (!station || !stationInfo) {
      throw new Error("Station not found!");
    }

    return <IStationInfo>{
      ...stationInfo,
      id: stationId,
      changeToWake: station.changeToWake,
      isCharging: station.isCharging,
      accountBalance: user.accountBalance ?? 0,
      stationHistories: [],
      whoUses: undefined,
    };
  } catch (error) {
    throw error;
  }
}

export async function myActiveStations(
  userId: string
): Promise<IStationInfo[]> {
  try {
    if (!userId) {
      throw new Error(`Requered fields does not exist!`);
    }

    const stationsInfoRef = FirebaseDatabase.ref(STATIONS_INFO);
    const stationsInfoSnapshot = await stationsInfoRef.once("value");

    const result: IStationInfo[] = [];
    for (const [key, value] of Object.entries(
      stationsInfoSnapshot.val() ?? {}
    )) {
      const { stationHistories, ...station } = value as IStationInfo;
      if (station?.whoUses?.user?.phoneNumber === userId) {
        station.id = key;
        station.isCharging = true;
        result.push(station);
      }
    }
    return result;
  } catch (error) {
    throw error;
  }
}

export async function myActiveStationById(
  stationId: string,
  userId: string
): Promise<IStationInfo> {
  try {
    if (!stationId || !userId) {
      throw new Error(`Requered fields does not exist!`);
    }
    const stationsRef = FirebaseDatabase.ref(STATIONS + "/" + stationId);
    const stationsInfoRef = FirebaseDatabase.ref(
      STATIONS_INFO + "/" + stationId
    );

    const stationsSnapshot = await stationsRef.once("value");
    const stationsInfoSnapshot = await stationsInfoRef.once("value");

    const station: IStation = stationsSnapshot.val();
    const stationInfo: IStationInfo = stationsInfoSnapshot.val();

    if (!station || !stationInfo) {
      throw new Error("Station not found!");
    }

    if (
      !stationInfo.whoUses?.user?.phoneNumber ||
      stationInfo.whoUses.user.phoneNumber !== userId
    ) {
      throw new Error(`Station ${stationId} is not used by you ${userId}`);
    }

    const { stationHistories, ...stationInfoWithoutHistory } = stationInfo;

    return <IStationInfo>{
      ...stationInfoWithoutHistory,
      id: stationId,
      changeToWake: station.changeToWake,
      isCharging: station.isCharging,
      // currentChargingPower: station.power ?? 0,
      currentChargingPower: 0,
    };
  } catch (error) {
    throw error;
  }
}
