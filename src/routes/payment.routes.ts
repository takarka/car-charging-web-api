import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import cors from "cors";

const allowedPaymentOrigins = ["https://194.187.247.152"];
const corsOptions = cors({
  origin: allowedPaymentOrigins,
});
const paymentRouter = Router();
paymentRouter.use(corsOptions);

paymentRouter.get("/user", paymentController.kaspiUserPayment);
paymentRouter.get("/station", paymentController.kaspiStationPayment);

export { paymentRouter };
