import { Request, Response } from "express";
import * as services from "../services/station.service";
import { getErrorMessage } from "../utils/errors.util";
import { IUser } from "../models/user.model";
import { IStation } from "../models/stations.model";

export const getAllStations = async (req: Request, res: Response) => {
  try {
    const response: IStation[] = await services.stations();
    res.status(200).send(response);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};
