export interface IPaymentRequest {
  txn_id: string;
  account: string; // идентификатор абонента/номер станций
  sum: number;
  command: PaymentRequestType;
  txn_date: string;
}

export type PaymentRequestType = "check" | "pay";

export interface IPaymentResponse {
  txn_id: string;
  prv_tnx_id: string;
  result: PaymentResponseType;
  sum: number;
  comment: string;
  fields?: {
    field1?: {
      userFullName: string;
      balance: number;
      minSumForPay: number;
    };
    field2?: {
      minSumForPay: number;
      isBusy: boolean;
      power: string;
      price: string;
      name: string;
      address: string;
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
