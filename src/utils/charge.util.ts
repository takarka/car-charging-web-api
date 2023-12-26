import dayjs from "dayjs";
import { IStationHistory, IStationInfo } from "../models/stations.model";

export function amountOfPower(price: number, cost: number): number {
  if (!cost || !price) {
    return 0;
  }

  return (cost ?? 0) / price;
}

export function amountOfCost(price: number, power: number): number {
  return price * power;
}

export function amountOfChargedPower(
  stationHistoryInfo: IStationHistory,
  dateNow: string
): number {
  const powerInSecond = (stationHistoryInfo?.power ?? 0) / 3600;

  const chargingTimeInSecond = dayjs(stationHistoryInfo.completionDate).diff(
    dateNow,
    "second"
  );

  if (chargingTimeInSecond < 0) {
    return amountOfPower(stationHistoryInfo.price, stationHistoryInfo.cost);
  }

  return Math.floor(powerInSecond * chargingTimeInSecond);
}

export function remainingSum(stationHistoryInfo: IStationHistory): number {
  const powerInSecond = (stationHistoryInfo?.power ?? 0) / 3600;

  const chargingTimeInSecond = dayjs(stationHistoryInfo.completionDate).diff(
    stationHistoryInfo.date,
    "second"
  );
  const factPower = Math.floor(powerInSecond * chargingTimeInSecond);
  const plannedPower = Math.floor(
    amountOfPower(stationHistoryInfo.price, stationHistoryInfo.cost)
  );

  if (factPower >= plannedPower) {
    return 0;
  }

  return stationHistoryInfo.cost - factPower * stationHistoryInfo.price;
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

  const chargingTotalTimeInSeconds = Math.floor(
    (powerToBeCharged / powerInHour) * 60 * 60
  );

  return dayjs(dateNow)
    .add(chargingTotalTimeInSeconds, "second")
    .utc()
    .toISOString();
}
