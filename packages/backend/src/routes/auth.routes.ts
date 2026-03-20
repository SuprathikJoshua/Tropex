import { Router } from "express";
import {
	getMe,
	login,
	logout,
	refresh,
	register,
} from "../controllers/auth.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getMe);
export default router;
