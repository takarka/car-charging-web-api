import { FirebaseDatabase } from "../firebase/admin";
import { USERS } from "../firebase/db-ref-name";
import {
  IPaymentRequest,
  IPaymentResponse,
  PaymentResponseType,
} from "../models/payment.model";
import { IUser, IUserAccountHistory } from "../models/user.model";

export async function kaspiPayment(
  data: IPaymentRequest
): Promise<IPaymentResponse> {
  if (data?.command == "check") {
    return paymentUserExistingCheck(data);
  } else if (data?.command == "pay") {
    return paymentPay(data);
  } else {
    return <IPaymentResponse>{
      txn_id: data?.txn_id,
      result: PaymentResponseType.ERROR,
    };
  }
}

async function paymentUserExistingCheck(
  data: IPaymentRequest
): Promise<IPaymentResponse> {
  try {
    if (!data?.account) {
      return <IPaymentResponse>{
        txn_id: data.txn_id,
        result: PaymentResponseType.ERROR,
        comment: "Account can not be empty!",
      };
    }

    const userRef = FirebaseDatabase.ref(USERS + "/" + data.account);
    const userSnapshot = await userRef.once("value");
    const user = userSnapshot.val();

    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: user ? PaymentResponseType.SUCCESS : PaymentResponseType.FAILED,
      comment: "User does not exists!",
    };
  } catch (error) {
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: PaymentResponseType.ERROR,
    };
  }
}

async function paymentPay(data: IPaymentRequest): Promise<IPaymentResponse> {
  try {
    if (!data?.account) {
      return <IPaymentResponse>{
        txn_id: data.txn_id,
        result: PaymentResponseType.ERROR,
        comment: "Account can not be empty!",
      };
    }
    
    const userRef = FirebaseDatabase.ref(USERS + "/" + data.account);
    const userSnapshot = await userRef.once("value");
    const user: IUser = userSnapshot.val();

    if (!user) {
      return <IPaymentResponse>{
        txn_id: data.txn_id,
        result: PaymentResponseType.ERROR,
        comment: "User does not exists!",
      };
    }

    if (data.sum == null || data.sum < 1) {
      return <IPaymentResponse>{
        txn_id: data.txn_id,
        result: PaymentResponseType.ERROR,
        comment: "Sum can not be less than 1",
      };
    }

    const userPaymentRef = userRef.child("accountHistories/" + data.txn_id);
    const userPayment = await userPaymentRef.once("value");
    if (userPayment.exists()) {
      return <IPaymentResponse>{
        txn_id: data.txn_id,
        result: PaymentResponseType.ERROR,
        comment: "Payment with txn_id already exists!",
      };
    }

    await userRef.child("accountHistories/" + data.txn_id).set(<
      IUserAccountHistory
    >{
      id: data.txn_id,
      client: "Kaspi",
      sum: data.sum,
      date: data.txn_date,
      type: "payment",
    });

    await userRef
      .child("accountBalance")
      .set(eval(`${user?.accountBalance ?? 0} + ${data.sum}`));

    return <IPaymentResponse>{
      txn_id: data.txn_id,
      prv_tnx_id: data.txn_id,
      result: PaymentResponseType.SUCCESS,
      sum: data.sum,
    };
  } catch (error) {
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: PaymentResponseType.ERROR,
    };
  }
}
