import crypto from "crypto";

const DEFAULT_SECRET = "dev-secret-altere-em-producao";

function getSecret(): string {
  return process.env.AUTH_SECRET?.trim() || DEFAULT_SECRET;
}

export type TokenPayload = {
  sub: string;
  email: string;
  accessProfile: string;
};

export function signAuthToken(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");

  if (signature !== expected) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as TokenPayload;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.accessProfile !== "string"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
