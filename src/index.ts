import dotenv from "dotenv";
import express, { Express } from "express";
import helmet from "helmet";
import { paymentRouter } from "./routes/payment.routes";
import { router } from "./routes/routes";

// make sure to create an .env file in the root of the project!
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3476;

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("", paymentRouter);

app.listen(port, () => {
  console.log(`Node.JS-Express API 📀 listening at http://localhost:${port}`);
});
