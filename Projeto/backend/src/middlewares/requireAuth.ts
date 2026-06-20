import type { Request, Response, NextFunction } from "express";
import { verifyAuthToken, type TokenPayload } from "../lib/authToken";

export type AuthenticatedRequest = Request & {
  user?: TokenPayload;
};

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (typeof header !== "string" || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: "Sessão inválida ou expirada" });
    return;
  }

  req.user = payload;
  next();
}
