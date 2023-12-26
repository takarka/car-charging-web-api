import { Router } from "express";
import * as stationController from "../controllers/station.controller";
import * as userController from "../controllers/user.controller";
import * as chargeController from "../controllers/charge.controller";
import { auth } from "../middleware/auth";
import cors from "cors";

const allowedOrigins = ["https://trade-electro.kz"];
const allowedOriginsCors = cors({
  origin: function (origin, callback) {
    console.log("CORS", origin);
    // allow requests with no origin
    // (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg =
        "The CORS policy for this site does not " +
        "allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
});

const router = Router();
router.use(allowedOriginsCors);

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
