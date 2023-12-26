import { Router } from "express";
import * as stationController from "../controllers/station.controller";
import * as userController from "../controllers/user.controller";
import * as chargeController from "../controllers/charge.controller";
import { auth } from "../middleware/auth";
import cors from "cors";

var allowlist = ["http://trade-electro.kz"];
var corsOptionsDelegate = function (req: any, callback: any) {
  var corsOptions;
  if (allowlist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

const router = Router();
router.use(cors());

router.post("/login", userController.loginOne);
router.post("/register", userController.registerOne);
router.post("/reset-password", userController.resetPassword);
router.get("/user-info", auth, userController.userInfo);

router.get("/stations", auth, stationController.getAllStations);
router.get("/stations/:id", auth, stationController.getStationById);

router.get(
  "/my-active-stations",
  auth,
  stationController.getAllMyActiveStations
);
router.get(
  "/my-active-stations/:id",
  auth,
  stationController.getMyActiveStationById
);

router.post("/charge/start", auth, chargeController.startCharge);
router.post("/charge/stop", auth, chargeController.stopCharge);

export { router };
