export interface IPaymentRequest {
  txn_id: string;
  account: string; // идентификатор абонента/номер станций
  sum: number;
  command: PaymentRequestType;
  txn_date: string;
}

export type PaymentRequestType = "check" | "pay" | "status";

export interface IPaymentResponse {
  txn_id: string;
  prv_tnx_id: string;
  result: PaymentResponseType;
  sum: number;
  comment: string;
  fields?: {
    field1?: {
      userFullName: string;
      phoneNumber: string;
      balance: number;
      minSumForPay: number;
    };
    field2?: {
      stationId: string;
      minSumForPay: number;
      isBusy: boolean;
      power: string;
      price: string;
      name: string;
      address: string;
      amountOfPower: string;
    };
    field3?: {
      stationId: string;
      name: string;
      address: string;
      isCompleted: boolean;
      returnSum: number;
    };
  };
}

export const enum PaymentResponseType {
  SUCCESS = 0,
  FAILED = 1,
  CANCELED = 2,
  PAID = 3,
  PROCESSING = 4,
  ERROR = 5,
}
