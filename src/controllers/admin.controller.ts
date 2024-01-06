import { Request, Response } from "express";
import { authUser } from "../middleware/auth";
import { IUser } from "../models/user.model";
import * as services from "../services/charge.service";
import { getErrorMessage } from "../utils/errors.util";

export const changeChargeState = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { stationId } = req.body;
    const user: IUser = authUser(req);
    const response: boolean = await services.changeChargeState(
      user.phoneNumber,
      stationId
    );

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(getErrorMessage(error));
  }
};
