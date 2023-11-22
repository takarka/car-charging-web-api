import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { IUser } from "../models/user.model";

export const SECRET_KEY: Secret = "takarka";

export interface CustomRequest extends Request {
  token: string | JwtPayload | IUser;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new Error();
    }
    const decodedToken = jwt.verify(token, SECRET_KEY);

    if (!decodedToken) {
      throw new Error();
    }
    (req as CustomRequest).token = decodedToken;
    next();
  } catch (err) {
    res.status(401).send("Unauthorized request, please authenticate!");
  }
};

export const authUser = (req: Request) => {
  return (req as CustomRequest)?.token as IUser;
};
