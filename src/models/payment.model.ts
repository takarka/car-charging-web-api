export interface IPaymentRequest {
  txn_id: string;
  account: string;
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
}

export const enum PaymentResponseType {
  SUCCESS = 0,
  FAILED = 1,
  CANCELED = 2,
  PAID = 3,
  PROCESSING = 4,
  ERROR = 5,
}
