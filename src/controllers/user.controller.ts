import { Request, Response } from "express";
import * as userServices from "../services/user.service";
import { getErrorMessage } from "../utils/errors.util";
import { IUser } from "../models/user.model";

export const loginOne = async (req: Request, res: Response) => {
  try {
    const foundUser: IUser = await userServices.login(req.body);
    const { password, ...response } = foundUser;
    res.status(200).send(response);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const registerOne = async (req: Request, res: Response) => {
  try {
    await userServices.register(req.body);
    res.status(200).send("Inserted successfully");
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};
