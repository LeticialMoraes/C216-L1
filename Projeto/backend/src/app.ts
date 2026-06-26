import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import categoriasRouter from "./routes/categorias";
import fornecedoresRouter from "./routes/fornecedores";
import produtosRouter from "./routes/produtos";
import movimentacoesRouter from "./routes/movimentacoes";
import dashboardRouter from "./routes/dashboard";
import relatoriosRouter from "./routes/relatorios";

export function createApp() {
  const app = express();

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
  app.use("/categorias", categoriasRouter);
  app.use("/fornecedores", fornecedoresRouter);
  app.use("/produtos", produtosRouter);
  app.use("/movimentacoes", movimentacoesRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/relatorios", relatoriosRouter);

  return app;
}
