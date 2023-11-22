import { IStationInfo } from "./stations.model";

export interface IUser {
  firstName: string;
  phoneNumber: string;
  accountBalance: number;
  accountHistories?: IUserAccountHistory[];
  password?: string;
}

export type IUserAccountHistory =
  | IUserAccountPaymentHistory
  | IUserAccountChargeHistory;

export interface IUserAccountHistoryBase {
  id: string;
  sum: number;
  date: string;
  type: UserAccountHistoryType;
}

export type UserAccountHistoryType = "payment" | "charge";

export interface IUserAccountPaymentHistory extends IUserAccountHistoryBase {
  client: string;
  type: "payment";
}
export interface IUserAccountChargeHistory extends IUserAccountHistoryBase {
  station: IStationInfo;
  type: "charge";
}

// {
//   amount: 2000,
//   station: {
//     id: 1223,
//     name: 'Station1',
//     address: 'Mega',
//     price: 70,
//   },
//   startDate: '2015-01',
//   endDate: '2015-01',
//   type: 'charge',
// },
