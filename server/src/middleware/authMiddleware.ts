import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User"; // Corrected path to the User model

const { JWT_SECRET, COOKIE_NAME = "token" } = process.env;

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as {
      userId: string;
    };
    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
