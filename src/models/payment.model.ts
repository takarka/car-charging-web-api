export interface IPaymentRequest {
  txn_id: string;
  account: string; // идентификатор абонента/номер станций
  sum: number;
  command: PaymentRequestType;
  txn_date: string;
}

export type PaymentRequestType = "check" | "pay" | "status";
export type PaymentRequestAccountType = "user" | "station";

export interface IPaymentResponse
  extends IPaymentUserResponse,
    IPaymentStationResponse,
    IPaymentStationStatusResponse {
  txn_id: string;
  prv_tnx_id: string;
  result: PaymentResponseType;
  sum: number;
  comment: string;
}

export interface IPaymentUserResponse {
  userFullName: string;
  phoneNumber: string;
  balance: number;
  minSumForPay: number;
}
export interface IPaymentStationResponse {
  stationId: string;
  minSumForPay: number;
  isBusy: boolean;
  power: string;
  price: string;
  name: string;
  address: string;
  amountOfPower: string;
}

export interface IPaymentStationStatusResponse {
  stationId: string;
  name: string;
  address: string;
  isCompleted: boolean;
  returnSum: number;
}

export const enum PaymentResponseType {
  SUCCESS = 0,
  FAILED = 1,
  CANCELED = 2,
  PAID = 3,
  PROCESSING = 4,
  ERROR = 5,
}
