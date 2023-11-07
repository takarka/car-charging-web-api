import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { router } from "./routes/routes";

// make sure to create an .env file in the root of the project!
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3476;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.listen(port, () => {
  console.log(`Node.JS-Express API 📀 listening at http://localhost:${port}`);
});
