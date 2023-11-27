import { Reference } from "firebase-admin/database";
import { FirebaseDatabase } from "../firebase/admin";
import { STATIONS, STATIONS_INFO, USERS } from "../firebase/db-ref-name";
import {
  IPaymentRequest,
  IPaymentResponse,
  PaymentResponseType,
} from "../models/payment.model";
import {
  IStation,
  IStationHistory,
  IStationInfo,
  StationType,
} from "../models/stations.model";
import { IUser, IUserAccountPaymentHistory } from "../models/user.model";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const minSumForPayUser = 100;
const minSumForPayStation = 1000;

export async function kaspiPayment(
  data: IPaymentRequest
): Promise<IPaymentResponse> {
  if (data?.txn_id == null || data.txn_id == "") {
    throw new Error("txn_id can not be empty!");
  }

  if (data?.command == "check") {
    return paymentCheck(data);
  } else if (data?.command == "pay") {
    return paymentPay(data);
  } else {
    throw new Error("command not found");
  }
}

async function paymentCheck(data: IPaymentRequest): Promise<IPaymentResponse> {
  const account = data?.account;
  if (!account) {
    throw new Error("account can not be empty!");
  }

  const userRef = FirebaseDatabase.ref(USERS + "/" + account);
  const userSnapshot = await userRef.once("value");
  const user: IUser = userSnapshot.val();

  if (user) {
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: PaymentResponseType.SUCCESS,
      comment: "Ok",
      fields: {
        field1: {
          userFullName: user?.firstName ?? "",
          balance: user.accountBalance ?? 0,
          minSumForPay: minSumForPayUser,
        },
      },
    };
  }

  const stationInfoRef = FirebaseDatabase.ref(STATIONS_INFO + "/" + account);
  const stationInfoSnapshot = await stationInfoRef.once("value");
  const stationInfo: IStationInfo = stationInfoSnapshot.val();

  if (stationInfo) {
    const isStationBusy = stationInfo.whoUses != null;
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: isStationBusy
        ? PaymentResponseType.ERROR
        : PaymentResponseType.SUCCESS,
      comment: isStationBusy ? `Station is busy!` : "Ok",
      fields: {
        field2: {
          isBusy: isStationBusy,
          minSumForPay: 1000,
          power: stationInfo.power + " кВт",
          price: stationInfo.price + " тг/кВт",
          name: stationInfo.name,
          address: stationInfo.address,
        },
      },
    };
  }

  return <IPaymentResponse>{
    txn_id: data.txn_id,
    result: PaymentResponseType.FAILED,
    comment: "Account not found!",
  };
}

async function paymentPay(data: IPaymentRequest): Promise<IPaymentResponse> {
  if (!data?.account) {
    throw new Error("account can not be empty!");
  }

  const userRef = FirebaseDatabase.ref(USERS + "/" + data.account);
  const userSnapshot = await userRef.once("value");
  const user: IUser = userSnapshot.val();

  if (user) {
    return paymentPayUser(data, userRef, user);
  }

  const stationInfoRef = FirebaseDatabase.ref(
    STATIONS_INFO + "/" + data.account
  );
  const stationInfoSnapshot = await stationInfoRef.once("value");
  const stationInfo: IStationInfo = stationInfoSnapshot.val();

  if (stationInfo) {
    return paymentPayStation(data, stationInfoRef, stationInfo);
  }

  return <IPaymentResponse>{
    txn_id: data.txn_id,
    result: PaymentResponseType.FAILED,
    comment: "Account not found!",
  };
}

async function paymentPayUser(
  data: IPaymentRequest,
  userRef: Reference,
  user: IUser
): Promise<IPaymentResponse> {
  if (data?.sum == null || data.sum < minSumForPayUser) {
    throw new Error(`Sum can not be less than ${minSumForPayUser}`);
  }

  const userAccountHistoryRef = userRef.child(
    "accountHistories/" + data.txn_id
  );
  const userAccountHistory = await userAccountHistoryRef.once("value");
  if (userAccountHistory.exists()) {
    throw new Error(`Payment with ${data.txn_id} already exists!`);
  }

  await userAccountHistoryRef.set({
    id: data.txn_id,
    client: "Kaspi",
    sum: data.sum,
    date: data.txn_date,
    type: "payment",
  } as IUserAccountPaymentHistory);

  await userRef
    .child("accountBalance")
    .set(eval(`${user?.accountBalance ?? 0} + ${data.sum}`));

  return <IPaymentResponse>{
    txn_id: data.txn_id,
    prv_tnx_id: data.txn_id,
    result: PaymentResponseType.SUCCESS,
    sum: +data.sum,
    comment: "OK",
  };
}

async function paymentPayStation(
  data: IPaymentRequest,
  stationsInfoRef: Reference,
  stationInfo: IStationInfo
): Promise<IPaymentResponse> {
  const stationID = data.account;

  if (data?.sum == null || data.sum < minSumForPayStation) {
    throw new Error(`Sum can not be less than ${minSumForPayStation}`);
  }

  const isTxnIdAlreadyExists = stationInfo?.stationHistories?.find(
    (history) => history?.order?.id != null && history.order.id == data?.txn_id
  );

  if (isTxnIdAlreadyExists) {
    throw new Error(`Payment with ${data?.txn_id} already exists!`);
  }

  if (stationInfo?.whoUses) {
    throw new Error(`The station is already in use by another user!`);
  }

  // mark as this station is used by Order
  await stationsInfoRef.child("whoUses").transaction(
    (currentData: IStationHistory) => {
      const dateNow = dayjs().utc().toISOString();
      return {
        price: stationInfo.price,
        power: stationInfo.power,
        cost: data.sum,
        date: dateNow,
        order: { id: data.txn_id, client: "Kaspi", date: data.txn_date },
      } as IStationHistory;
      // TODO: why?
    },
    (error, committed, snapshot) => {
      if (error) {
        console.log("whoUses Transaction failed abnormally!", error);
        // throw error;
      } else if (!committed) {
        console.log(
          "whoUses We aborted the transaction (because ada already exists)."
        );
        // throw error;
      } else {
        console.log("whoUses added!");
      }
      console.log("stationsInfoRef data: ", snapshot?.val());
    }
  );

  // start charging at this STATION
  const stationsRef = FirebaseDatabase.ref(STATIONS + "/" + stationID);
  const stationsSnapshot = await stationsRef.once("value");
  const station: IStation = stationsSnapshot.val();
  if (station == null) {
    throw new Error(`Account not found!`);
  }

  await stationsRef.child("changeToWake/changeMe").transaction(
    (currentData: StationType) => {
      // TODO: why?
      return 1;
    },
    (error, committed, snapshot) => {
      if (error) {
        console.log("changeMe Transaction failed abnormally!", error);
        // throw error;
      } else if (!committed) {
        console.log(
          "changeMe We aborted the transaction (because ada already exists)."
        );
        // throw error;
      } else {
        console.log("changeMe!");
      }
      console.log("stationsRef data: ", snapshot?.val());
    }
  );

  return <IPaymentResponse>{
    txn_id: data.txn_id,
    prv_tnx_id: data.txn_id,
    result: PaymentResponseType.SUCCESS,
    sum: data.sum,
    comment: "OK",
  };
}
