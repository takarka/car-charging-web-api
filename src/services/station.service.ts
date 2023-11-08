import { FirebaseDatabase } from "../firebase/admin";
import { STATIONS, STATIONS_INFO } from "../firebase/db-ref-name";
import { IStation } from "../models/stations.model";

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

export async function stationById(id: string): Promise<IStation> {
  try {
    const stationsInfoRef = FirebaseDatabase.ref(STATIONS_INFO + "/" + id);
    const stationsInfoSnapshot = await stationsInfoRef.once("value");

    return { id, ...stationsInfoSnapshot.val() };
  } catch (error) {
    throw error;
  }
}
