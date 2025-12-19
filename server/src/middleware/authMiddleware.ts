// server/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_insecure_secret";
const COOKIE_NAME = process.env.COOKIE_NAME || "token";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    // Add other payload fields if needed
  };
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Get token from cookie or header
    let token = req.cookies?.[COOKIE_NAME];
    
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    // 3. Attach payload to req.user (Stateless!)
    // We do NOT check the DB (users array) here to keep it strictly stateless middleware.
    // If you want to ensure user exists, check users.find() using decoded.id
    // But for performance/simplicity in this no-db setup, we trust the signature.
    
    (req as AuthRequest).user = {
      _id: decoded.id
    };

    next();
  } catch (err: unknown) {
    // console.error("Auth Middleware Error:", err);
    const message = err instanceof Error ? err.message : "Invalid token";
    return res.status(401).json({ error: "Unauthorized: " + message });
  }
};
