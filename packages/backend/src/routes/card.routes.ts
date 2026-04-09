import { Router } from "express";
import {
	getAllCards,
	getCardById,
	getCardHistory,
	getCardTrades,
} from "../controllers/card.controller";

const router = Router();

router.get("/", getAllCards);
router.get("/:id", getCardById);
router.get("/:id/history", getCardHistory);
router.get("/:id/trades", getCardTrades);

export default router;
