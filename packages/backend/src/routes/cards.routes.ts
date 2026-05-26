import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createCard, getMyCards } from "../controllers/cards.controller";

const router = Router();

router.post("/create", verifyJWT, createCard);
router.get("/my-cards", verifyJWT, getMyCards);

export default router;
