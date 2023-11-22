import { FirebaseDatabase } from "../firebase/admin";
import { STATIONS, STATIONS_INFO, USERS } from "../firebase/db-ref-name";
import { IStation } from "../models/stations.model";
import { IUser } from "../models/user.model";

export async function stations(): Promise<IStation[]> {
  try {
    const stationsRef = FirebaseDatabase.ref(STATIONS);
    const stationsInfoRef = FirebaseDatabase.ref(STATIONS_INFO);
    const stationsSnapshot = await stationsRef.once("value");
    const stationsInfoSnapshot = await stationsInfoRef.once("value");

    const stationValue = stationsSnapshot.val();
    const result: IStation[] = [];
    for (const [key, value] of Object.entries(
      stationsInfoSnapshot.val() ?? {}
    )) {
      const station: IStation = value as IStation;
      station.id = key;
      station.isCharging = isStationCharging(key, stationValue);
      result.push(station);
    }
    return result;
  } catch (error) {
    throw error;
  }
}

function isStationCharging(id: string, stationValue: any): boolean {
  return stationValue != null && stationValue[id]
    ? stationValue[id].isCharging
    : false;
}

export async function stationById(
  id: string,
  userId: string
): Promise<IStation | null> {
  try {
    if (!id || !userId) {
      return null;
    }
    const userRef = FirebaseDatabase.ref(USERS + "/" + userId);
    const stationsRef = FirebaseDatabase.ref(STATIONS + "/" + id);
    const stationsInfoRef = FirebaseDatabase.ref(STATIONS_INFO + "/" + id);

    const userSnapshot = await userRef.once("value");
    const stationsSnapshot = await stationsRef.once("value");
    const stationsInfoSnapshot = await stationsInfoRef.once("value");

    const user: IUser = userSnapshot.val();
    const station: IStation = stationsSnapshot.val();
    const stationInfo: IStation = stationsInfoSnapshot.val();

    if (!station || !stationInfo) {
      throw new Error("Station not found!");
    }

    return <IStation>{
      ...stationInfo,
      id,
      changeToWake: station.changeToWake,
      isCharging: station.isCharging,
      accountBalance: user.accountBalance ?? 0,
    };
  } catch (error) {
    throw error;
  }
}
