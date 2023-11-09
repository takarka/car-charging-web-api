import { Router } from "express";
import * as stationController from "../controllers/station.controller";
import * as userController from "../controllers/user.controller";
import { auth } from "../middleware/auth";

const router = Router();

router.post("/login", userController.loginOne);
router.post("/register", userController.registerOne);

router.get("/stations", auth, stationController.getAllStations);
router.get("/stations/:id", auth, stationController.getStationById);

export { router };
