import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/api/v1/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
