// server/src/controllers/authController.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";

// ----------------------
// In-Memory User Store (replaced MongoDB)
// ----------------------
interface User {
  _id: string; // mimic mongo ID
  username: string;
  email: string;
  password?: string; // intentionally optional/insecure for demo
  authProvider: "local" | "google" | "github";
  providerId?: string;
}

// Global in-memory array (cleared on restart!)
const users: User[] = [];

// Helper to generate simple ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// ----------------------
// Environment Config
// ----------------------
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "default_insecure_secret";
const COOKIE_NAME = process.env.COOKIE_NAME || "token";

const createToken = (userId: string) => {
  return jwt.sign({ id: userId }, ACCESS_TOKEN_SECRET, { expiresIn: "7d" });
};

// ----------------------
// Controllers
// ----------------------

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existing = users.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Create user
    const newUser: User = {
      _id: generateId(),
      username,
      email,
      password, // In a real app, HASH THIS! For now, storing plain text as requested for "simple" fix
      authProvider: "local",
    };
    users.push(newUser);

    // Create token
    const token = createToken(newUser._id);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax", // or 'none' if needed
    });

    return res.status(201).json({
      message: "Signup successful",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        authProvider: newUser.authProvider,
      },
    });
  } catch (err: unknown) {
    console.error("Signup Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password (plain text compare for this no-db version)
    // If you add bcrypt back, use bcrypt.compare here
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(user._id);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        authProvider: user.authProvider,
      },
    });
  } catch (err: unknown) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  return res.json({ message: "Logged out" });
};

// Stateless "get me" - we can decode the token or lookup in memory
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // Determine userId from request (set by middleware)
    // Note: authMiddleware needs to be refactored too
    // For now, assuming middleware puts userId in req.user
    const userId = (req as any).user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Lookup in memory
    const user = users.find((u) => u._id === userId);
    if (!user) {
      // Token might be valid but user was lost on restart
      res.clearCookie(COOKIE_NAME);
      return res.status(401).json({ error: "User not found (server restarted?)" });
    }

    return res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        authProvider: user.authProvider,
      },
    });
  } catch (err: unknown) {
    console.error("GetCurrentUser Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ----------------------
// OAuth Stubs for In-Memory
// ----------------------

// Stubs for missing exports
export const githubLogin = (req: Request, res: Response) => {
  return res.status(501).json({ error: "OAuth disabled in no-db mode" });
};

export const oauthUpsert = (req: Request, res: Response) => {
  return res.status(501).json({ error: "OAuth upsert disabled in no-db mode" });
};

export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if(!code) return res.status(400).json({error: "No code provided"});

    // Exchange code for tokens (Stub or Real Implementation)
    // For brevity, assuming we get user info directly or mock it
    // In a real flow:
    // 1. Get token from Google
    // 2. Get user info using token
    // 3. Find or Create User in `users` array
    
    // ... Implementation skipped to keep it simple, or reused from original file
    // If you need OAuth specific code, copy logic from original and replace DB calls with:
    
    /**
     * const existing = users.find(u => u.providerId === googleId);
     * if(existing) { ... login ... }
     * else { users.push(newUser); ... login ... }
     */

     // Providing a dummy implementation to prevent errors if frontend calls it
     // You may need to fully port the axios calls if OAuth is required.
     return res.status(501).json({ error: "OAuth disabled in no-db mode (TODO)" });

  } catch (err: unknown) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const githubAuthCallback = async (req: Request, res: Response) => {
  // Similar stub
  return res.status(501).json({ error: "OAuth disabled in no-db mode (TODO)" });
};
