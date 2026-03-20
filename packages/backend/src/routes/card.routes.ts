import { Router } from "express";
import {
	getAllCards,
	getCardById,
	getCardHistory,
} from "../controllers/card.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verifyJWT, getAllCards);
router.get("/:id", verifyJWT, getCardById);
router.get("/:id/history", verifyJWT, getCardHistory);

export default router;
