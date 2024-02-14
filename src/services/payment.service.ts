import { Reference } from "firebase-admin/database";
import { FirebaseDatabase } from "../firebase/admin";
import {
  STATIONS,
  STATIONS_INFO,
  UNIQUE_IDS,
  USERS,
} from "../firebase/db-ref-name";
import {
  IPaymentRequest,
  IPaymentResponse,
  PaymentRequestAccountType,
  PaymentResponseType,
} from "../models/payment.model";
import {
  IStation,
  IStationHistory,
  IStationInfo,
} from "../models/stations.model";
import { IUser, IUserAccountPaymentHistory } from "../models/user.model";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  amountOfPower,
  calculateCompletionDate,
  remainingSum,
} from "../utils/charge.util";
dayjs.extend(utc);

const minSumForPayUser = 10;
const minSumForPayStation = 10;

export async function kaspiPayment(
  data: IPaymentRequest,
  accountType: PaymentRequestAccountType
): Promise<IPaymentResponse> {
  if (data?.txn_id == null || data.txn_id == "") {
    throw new Error("txn_id can not be empty!");
  }

  if (data?.command == "check") {
    return accountType == "station"
      ? paymentStationCheck(data)
      : paymentUserCheck(data);
  } else if (data?.command == "status") {
    return accountType == "station"
      ? paymentStationStatus(data)
      : paymentUserStatus(data);
  } else if (data?.command == "pay") {
    return accountType == "station"
      ? paymentPayStation(data)
      : paymentPayUser(data);
  } else {
    throw new Error("command not found");
  }
}

async function paymentUserCheck(
  data: IPaymentRequest
): Promise<IPaymentResponse> {
  const account = data?.account;
  if (!account) {
    throw new Error("account can not be empty!");
  }

  const userRef = FirebaseDatabase.ref(USERS + "/" + account);
  const userSnapshot = await userRef.once("value");

  if (!userSnapshot.exists()) {
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: PaymentResponseType.FAILED,
      comment: "User not found!!!",
    };
  }
  const user: IUser = userSnapshot.val();

  return <IPaymentResponse>{
    txn_id: data.txn_id,
    result: PaymentResponseType.SUCCESS,
    comment: "Ok",
    userFullName: user?.firstName ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    balance: user.accountBalance ?? 0,
    minSumForPay: minSumForPayUser,
  };
}

async function paymentStationCheck(
  data: IPaymentRequest
): Promise<IPaymentResponse> {
  const account = data?.account;
  if (!account) {
    throw new Error("account can not be empty!");
  }

  const stationInfoRef = FirebaseDatabase.ref(STATIONS_INFO + "/" + account);
  const stationInfoSnapshot = await stationInfoRef.once("value");
  const stationInfo: IStationInfo = stationInfoSnapshot.val();

  if (!stationInfo) {
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: PaymentResponseType.FAILED,
      comment: "Station not found!",
    };
  }

  const isStationBusy = stationInfo.whoUses != null;

  const amountOfPowerObj: any = {};
  if (data?.sum != null) {
    amountOfPowerObj.amountOfPower =
      Math.floor(amountOfPower(stationInfo.price, data.sum)) + " кВт";
  }

  return <IPaymentResponse>{
    txn_id: data.txn_id,
    result: isStationBusy
      ? PaymentResponseType.ERROR
      : PaymentResponseType.SUCCESS,
    comment: isStationBusy ? `Station is busy!` : "Ok",
    stationId: account,
    isBusy: isStationBusy,
    minSumForPay: minSumForPayStation,
    power: stationInfo.power + " кВт⋅час",
    price: stationInfo.price + " тг/кВт",
    name: stationInfo.name,
    address: stationInfo.address,
    ...amountOfPowerObj,
  };
}

async function paymentUserStatus(
  data: IPaymentRequest
): Promise<IPaymentResponse> {
  return <IPaymentResponse>{
    txn_id: data.txn_id,
    result: PaymentResponseType.FAILED,
    comment: "User status not available!",
  };
}

async function paymentStationStatus(
  data: IPaymentRequest
): Promise<IPaymentResponse> {
  const account = data?.account;
  const txn_id = data?.txn_id;

  if (!account) {
    throw new Error("account can not be empty!");
  }
  if (!txn_id) {
    throw new Error("txn_id can not be empty!");
  }

  const stationInfoRef = FirebaseDatabase.ref(STATIONS_INFO + "/" + account);
  const stationInfoSnapshot = await stationInfoRef.once("value");
  const stationInfo: IStationInfo = stationInfoSnapshot.val();

  if (txn_id == stationInfo?.whoUses?.order?.id) {
    return <IPaymentResponse>{
      txn_id: txn_id,
      result: PaymentResponseType.SUCCESS,
      comment: "Charging is not completed!",
      stationId: account,
      name: stationInfo.name,
      address: stationInfo.address,
      isCompleted: false,
      returnSum: 0,
    };
  }

  const stationHistoryInfo = Object.entries(
    stationInfo?.stationHistories ?? []
  ).find(
    ([id, history]) =>
      history?.order?.id != null && history.order.id == data?.txn_id
  );

  if (stationHistoryInfo && stationHistoryInfo[1]) {
    return <IPaymentResponse>{
      txn_id: txn_id,
      result: PaymentResponseType.SUCCESS,
      comment: `Charging is completed!`,
      stationId: account,
      name: stationInfo.name,
      address: stationInfo.address,
      isCompleted: true,
      returnSum: remainingSum(stationHistoryInfo[1]),
    };
  }

  return <IPaymentResponse>{
    txn_id: txn_id,
    result: PaymentResponseType.FAILED,
    comment: "Station or txt_id  are not found!",
  };
}

async function paymentPayUser(
  data: IPaymentRequest
): Promise<IPaymentResponse> {
  if (!data?.account) {
    throw new Error("account can not be empty!");
  }

  const userRef = FirebaseDatabase.ref(USERS + "/" + data.account);
  const userSnapshot = await userRef.once("value");
  const user: IUser = userSnapshot.val();

  if (user == null) {
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: PaymentResponseType.FAILED,
      comment: "User not found!",
    };
  }

  if (data?.sum == null || data.sum < minSumForPayUser) {
    throw new Error(`Sum can not be less than ${minSumForPayUser}`);
  }

  const userAccountHistoryRef = userRef.child(
    "accountHistories/" + data.txn_id
  );
  const userAccountHistory = await userAccountHistoryRef.once("value");
  if (userAccountHistory.exists()) {
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: PaymentResponseType.PAID,
      comment: `Payment with ${data.txn_id} already exists!`,
    };
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
  data: IPaymentRequest
): Promise<IPaymentResponse> {
  const stationID = data?.account;
  if (!stationID) {
    throw new Error("account can not be empty!");
  }

  const stationInfoRef = FirebaseDatabase.ref(STATIONS_INFO + "/" + stationID);
  const stationInfoSnapshot = await stationInfoRef.once("value");
  const stationInfo: IStationInfo = stationInfoSnapshot.val();

  if (!stationInfo) {
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: PaymentResponseType.FAILED,
      comment: "Station not found!",
    };
  }

  const dateNow = dayjs().utc().toISOString();

  if (data?.sum == null || data.sum < minSumForPayStation) {
    throw new Error(`Sum can not be less than ${minSumForPayStation}`);
  }

  const stationHistoryInfo = Object.entries(
    stationInfo?.stationHistories ?? []
  ).find(
    ([id, history]) =>
      history?.order?.id != null && history.order.id == data?.txn_id
  );

  if (stationHistoryInfo && stationHistoryInfo[1]) {
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: PaymentResponseType.PAID,
      comment: `Payment with ${data?.txn_id} already exists!`,
    };
  }

  if (stationInfo?.whoUses) {
    throw new Error(`The station is already in use by another user!`);
  }
  // GENERATE NEW ID FOR HISTORY
  const newHistoryId = await FirebaseDatabase.ref(UNIQUE_IDS).push().key;
  if (!newHistoryId) {
    throw new Error(`New history ID can not generated!`);
  }

  // mark as this station is used by Order
  const stationsInfoWhoUsesTransaction = await stationInfoRef
    .child("whoUses")
    .transaction((currentData) => {
      if (currentData == null) {
        return {
          id: newHistoryId,
          price: stationInfo.price,
          power: stationInfo.power,
          cost: data.sum,
          date: dateNow,
          completionDate: calculateCompletionDate(
            stationInfo,
            data.sum,
            dateNow
          ),
          order: { id: data.txn_id, client: "Kaspi", date: data.txn_date },
        } as IStationHistory;
      }
      // Abort the transaction.
      return;
    });

  if (!stationsInfoWhoUsesTransaction?.committed) {
    //
    throw new Error(
      `Station ${data?.account} is used by another user! (transaction)`
    );
  }

  // start charging at this STATION
  const stationsRef = FirebaseDatabase.ref(STATIONS + "/" + stationID);
  const stationsSnapshot = await stationsRef.once("value");
  const station: IStation = stationsSnapshot.val();
  if (station == null) {
    return <IPaymentResponse>{
      txn_id: data.txn_id,
      result: PaymentResponseType.FAILED,
      comment: `Station ${stationID} not found!`,
    };
  }

  await stationsRef.child("changeToWake/changeMe").set(1);

  return <IPaymentResponse>{
    txn_id: data.txn_id,
    prv_tnx_id: data.txn_id,
    result: PaymentResponseType.SUCCESS,
    sum: data.sum,
    comment: "OK",
  };
}
