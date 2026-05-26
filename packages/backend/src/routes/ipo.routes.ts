import Router from "express";
import { subscribeToIpo } from "../controllers/ipo.controller";
import { getSubscribedIpoByCardId } from "../controllers/ipo.controller";
import { getActiveIpos } from "../controllers/ipo.controller";
import { getSingleIpoByCardId } from "../controllers/ipo.controller";
import { cancelIpoSubscription } from "../controllers/ipo.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
const router = Router();

router.get("/active", getActiveIpos);
router.post("/subscribe", verifyJWT, subscribeToIpo);
router.get("/subscribe/:cardId", verifyJWT, getSubscribedIpoByCardId);
router.get("/:cardId", verifyJWT, getSingleIpoByCardId);
router.delete("/subscribe/:cardId", verifyJWT, cancelIpoSubscription);

export default router;
