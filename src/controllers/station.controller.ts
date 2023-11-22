import { Request, Response } from "express";
import { authUser } from "../middleware/auth";
import { IStationInfo } from "../models/stations.model";
import { IUser } from "../models/user.model";
import * as services from "../services/station.service";
import { getErrorMessage } from "../utils/errors.util";

export const getAllStations = async (req: Request, res: Response) => {
  try {
    const response: IStationInfo[] = await services.stations();
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
    const response: IStationInfo = await services.stationById(
      id,
      user?.phoneNumber
    );

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(getErrorMessage(error));
  }
};

export const getAllMyActiveStations = async (req: Request, res: Response) => {
  try {
    const user: IUser = authUser(req);
    const response: IStationInfo[] = await services.myActiveStations(
      user?.phoneNumber
    );
    res.status(200).send(response);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getMyActiveStationById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      params: { id },
    } = req;
    const user: IUser = authUser(req);
    const response: IStationInfo = await services.myActiveStationById(
      id,
      user?.phoneNumber
    );

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(getErrorMessage(error));
  }
};
