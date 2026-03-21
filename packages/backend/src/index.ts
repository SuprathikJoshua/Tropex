import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import cardRoutes from "./routes/card.routes";
import tradeRoutes from "./routes/trade.routes";
import walletRoutes from "./routes/wallet.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
const app = express();

app.use(express.json());
app.use(
	cors({
		origin: process.env.FRONTEND_URL,
		credentials: true,
	}),
);
app.use(helmet());
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/cards", cardRoutes);
app.use("/api/v1/trade", tradeRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
