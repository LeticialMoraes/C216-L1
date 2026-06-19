import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API em http://0.0.0.0:${PORT}`);
});
