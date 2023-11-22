import { Request, Response } from "express";
import * as userServices from "../services/user.service";
import { getErrorMessage } from "../utils/errors.util";
import { IUser } from "../models/user.model";

export const loginOne = async (req: Request, res: Response) => {
  try {
    const foundUser: IUser = await userServices.login(req.body);
    return res.status(200).send(foundUser);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const registerOne = async (req: Request, res: Response) => {
  try {
    await userServices.register(req.body);
    return res.status(200).send(true);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};
