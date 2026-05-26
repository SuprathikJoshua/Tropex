import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createCard } from "../controllers/cards.controller";

const router = Router();

router.post("/create", verifyJWT, createCard);

export default router;
