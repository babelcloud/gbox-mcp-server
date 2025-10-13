import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { AuthenticatedRequest } from "../types/auth.js";
const ISSUER = process.env.GBOX_ISSUER || "https://gbox.ai";
const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;
let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

async function getJWKS(): Promise<ReturnType<typeof createRemoteJWKSet>> {
  if (!JWKS) {
    console.log("Creating JWKS from", JWKS_URL);
    JWKS = createRemoteJWKSet(new URL(JWKS_URL));
    console.log("JWKS created", JWKS);
  }
  return JWKS;
}

export async function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.substring(7);
    const jwks = await getJWKS();

    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
    });

    if (!payload.sub || !payload.org_id) {
      res.status(401).json({ error: "Invalid token: missing sub or org_id" });
      return;
    }

    console.log(
      `JWT verified, sessionId: ${sessionId}, userId: ${payload.sub}, organizationId: ${payload.org_id}`
    );

    (req as AuthenticatedRequest).user = {
      userId: payload.sub,
      organizationId: payload.org_id as string,
      apiKey: token,
    };

    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    res.status(401).json({ error: "Invalid token" });
  }
}
