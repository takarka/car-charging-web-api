export interface IUser {
  firstName: string;
  phoneNumber: string;
  password: string;
  accountBalance: number;
  accountHistories: IUserAccountHistory[];
}

export interface IUserAccountHistory {
  id: string;
  client: string;
  sum: number;
  date: string;
  type: UserAccountHistoryType;
}

export type UserAccountHistoryType = "payment" | "charge";

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
