export interface IStation {
  id: string;
  name: string;
  address: string;
  power: number;
  price: number;
  changeToWake: IStationChargeState;
}

export interface IStationChargeState {
  changeMe: StationType;
}
export type StationType = 1 | 0; // 1 - on, 0 - off
