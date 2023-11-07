import { Router } from "express";
import * as userController from "../controllers/user.controller";

const router = Router();

router.post("/login", userController.loginOne);
router.post("/register", userController.registerOne);

export { router };
