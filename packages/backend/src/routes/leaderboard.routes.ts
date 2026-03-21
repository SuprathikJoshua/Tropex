import { Router } from "express";
import { getLeaderBoard } from "../controllers/leaderboard.controller";

const router = Router();

router.get("/", getLeaderBoard);

export default router;
