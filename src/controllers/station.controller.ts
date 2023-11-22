import { Request, Response } from "express";
import { IStation } from "../models/stations.model";
import * as services from "../services/station.service";
import { getErrorMessage } from "../utils/errors.util";
import { authUser } from "../middleware/auth";
import { IUser } from "../models/user.model";

export const getAllStations = async (req: Request, res: Response) => {
  try {
    const response: IStation[] = await services.stations();
    res.status(200).send(response);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getStationById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      params: { id },
    } = req;
    const user: IUser = authUser(req);
    const response: IStation | null = await services.stationById(
      id,
      user?.phoneNumber
    );

    res.status(response ? 200 : 404).json(response);
  } catch (error) {
    throw error;
  }
};
