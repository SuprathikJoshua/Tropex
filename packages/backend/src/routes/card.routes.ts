import { Router } from "express";
import {
	getAllCards,
	getCardById,
	getCardHistory,
} from "../controllers/card.controller";

const router = Router();

router.get("/", getAllCards);
router.get("/:id", getCardById);
router.get("/:id/history", getCardHistory);

export default router;
