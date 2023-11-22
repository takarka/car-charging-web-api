import { IUser } from "./user.model";

export interface IStation {
  id: string;
  name: string;
  address: string;
  power: number;
  price: number;
  changeToWake: IStationChargeState;
  isCharging: boolean;
}

export interface IStationChargeState {
  changeMe: StationType;
}
export type StationType = 1 | 0; // 1 - on, 0 - off

export interface IStationInfo extends IStation {
  whoUses: string;
  stationHistories?: IStationHistory[];
}

export interface IStationHistory {
  price: number;
  power: number;
  cost: number;
  date: string;
  user: IUser;
}
