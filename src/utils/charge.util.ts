import dayjs from "dayjs";
import { IStationInfo } from "../models/stations.model";

export function amountOfPower(price: number, cost: number): number {
  if (!cost || !price) {
    return 0;
  }

  return (cost ?? 0) / price;
}

export function amountOfCost(price: number, power: number): number {
  return price * power;
}

export function calculateCompletionDate(
  stationInfo: IStationInfo,
  cost: number,
  dateNow: string
): string {
  // in hours
  const powerInHour = stationInfo?.power ?? 0;
  const powerToBeCharged = amountOfPower(stationInfo?.price, cost);
  if (!powerToBeCharged || !powerInHour) {
    return "0";
  }

  const chargingTotalTimeInSeconds = Math.round(
    (powerToBeCharged / powerInHour) * 60 * 60
  );

  return dayjs(dateNow)
    .add(chargingTotalTimeInSeconds, "second")
    .utc()
    .toISOString();
}
