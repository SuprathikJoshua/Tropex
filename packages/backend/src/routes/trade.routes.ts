import { Router } from "express";
import {
	buyCard,
	previewTrade,
	sellCard,
} from "../controllers/trade.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

//3 routes - Preview , Buy , Sell
router.get("/preview", verifyJWT, previewTrade);
router.post("/buy", verifyJWT, buyCard);
router.post("/sell", verifyJWT, sellCard);

export default router;
