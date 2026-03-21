import { Router } from "express";
import { getPortfolio } from "../controllers/portfolio.controller";

const router = Router();

router.get("/", getPortfolio);

export default router;
