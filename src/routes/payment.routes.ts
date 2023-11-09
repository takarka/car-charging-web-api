import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";

const paymentRouter = Router();

paymentRouter.get("/api/payment_app.cgi", paymentController.kaspiPayment);

export { paymentRouter };
