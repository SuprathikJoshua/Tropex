import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { getWallet } from "../controllers/wallet.controller";

const router = Router();

router.get("/", verifyJWT, getWallet);

export default router;
