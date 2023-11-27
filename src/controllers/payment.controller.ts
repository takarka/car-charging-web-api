import { Request, Response } from "express";
import { IPaymentResponse, PaymentResponseType } from "../models/payment.model";
import * as services from "../services/payment.service";
import { getErrorMessage } from "../utils/errors.util";

export const kaspiPayment = async (req: Request, res: Response) => {
  try {
    const queryParams: any = req.query;
    const response: IPaymentResponse = await services.kaspiPayment(queryParams);
    return res.status(200).send(response);
  } catch (error) {
    return res.status(200).send(<IPaymentResponse>{
      txn_id: req?.body?.txn_id,
      result: PaymentResponseType.ERROR,
      comment: getErrorMessage(error),
    });
  }
};
