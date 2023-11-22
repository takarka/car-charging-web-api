import { Request, Response } from "express";
import { authUser } from "../middleware/auth";
import { IStation } from "../models/stations.model";
import { IUser } from "../models/user.model";
import * as services from "../services/charge.service";

export const startCharge = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { stationId, cost } = req.body;
    const user: IUser = authUser(req);
    const response: boolean = await services.startCharging(
      user?.phoneNumber,
      stationId,
      cost
    );

    res.status(200).json(response);
  } catch (error) {
    throw error;
  }
};

export const stopCharge = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { stationId, cost } = req.body;
    const user: IUser = authUser(req);
    const response: IStation | null = await services.startCharging(
      user?.phoneNumber,
      stationId,
      cost
    );

    res.status(response ? 200 : 500).json(response);
  } catch (error) {
    throw error;
  }
};
