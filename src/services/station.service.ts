import { FirebaseDatabase } from "../firebase/admin";
import { IStation } from "../models/stations.model";

export async function stations(): Promise<IStation[]> {
  try {
    const dbRef = FirebaseDatabase.ref("stations");
    const snapshot = await dbRef.once("value");
    const result: IStation[] = [];
    for (const [key, value] of Object.entries(snapshot.val() ?? {})) {
      const station: IStation = value as IStation;
      station.id = key;
      result.push(station);
    }
    console.log(result);
    return result;
  } catch (error) {
    throw error;
  }
}
