import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User"; // Corrected path relative to server/src/
import bcrypt from "bcrypt";
const { GITHUB_ID, GITHUB_SECRET, JWT_SECRET, COOKIE_NAME, NEXTAUTH_URL } =
  process.env;
// Helper to create a session token and set it as a cookie
const setTokenCookie = (res: Response, userId: string) => {
  const token = jwt.sign({ userId }, JWT_SECRET as string, { expiresIn: "7d" });
  res.cookie(COOKIE_NAME as string, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
};
// Email/Password signup
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    return res.status(500).json({ error: "Failed to signup" });
  }
};

// Email/Password login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ error: "User does not have a local password" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    setTokenCookie(res, user._id.toString());
    return res.status(200).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    return res.status(500).json({ error: "Failed to login" });
  }
};

// Logout clears the cookie
export const logout = async (_req: Request, res: Response) => {
  try {
    res.clearCookie((COOKIE_NAME as string) || "token", { path: "/" });
    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to logout" });
  }
};

// Return current user from cookie
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies[(COOKIE_NAME as string) || "token"];
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const decoded = jwt.verify(token, JWT_SECRET as string) as { userId: string };
    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(user);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// 1. Redirects the user to GitHub to authorize the app
export const githubLogin = (req: Request, res: Response) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_ID}`;
  res.redirect(url);
};

// 2. GitHub redirects back to this endpoint after authorization
export const githubCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  try {
    // Exchange the code for an access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_ID,
        client_secret: GITHUB_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );
    const { access_token } = tokenResponse.data;

    // Use the access token to get the user's profile
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const { email, name, id: githubId } = userResponse.data;

    // Check if the user already exists in your database
    let user = await User.findOne({ email });

    // If the user doesn't exist, create a new one
    if (!user) {
      user = await User.create({
        email,
        name: name || "GitHub User",
        authProvider: `github|${githubId}`,
      });
    }

    // Create a session for the user
    setTokenCookie(res, user._id.toString());

    // Redirect to the frontend application
    res.redirect(`${NEXTAUTH_URL}/code-page`);
  } catch (error) {
    console.error("GitHub Authentication Error:", error);
    res.redirect(`${NEXTAUTH_URL}/login?error=github_failed`);
  }
};

// 3. Generic OAuth upsert for NextAuth-based flows
// This endpoint allows the frontend (NextAuth callbacks) to upsert a user after a successful OAuth login.
export const oauthUpsert = async (req: Request, res: Response) => {
  try {
    const { email, name, provider, providerId } = req.body as {
      email?: string | null;
      name?: string;
      provider?: string;
      providerId?: string | number;
    };

    if (!provider || !providerId) {
      return res.status(400).json({ error: "provider and providerId are required" });
    }

    // Some providers (like GitHub) may not expose email. Fallback to provider+id.
    const authProviderKey = `${provider}|${providerId}`;

    let user = null as any;
    if (email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      user = await User.findOne({ authProvider: authProviderKey });
    }

    if (!user) {
      // Email is required in schema; if missing, create a placeholder to keep uniqueness
      const ensuredEmail = email || `${provider}_${providerId}@placeholder.local`;
      user = await User.create({
        email: ensuredEmail,
        name: name || "OAuth User",
        authProvider: authProviderKey,
      });
    } else {
      // Update provider info and name if needed
      let changed = false;
      if (!user.authProvider) {
        user.authProvider = authProviderKey;
        changed = true;
      }
      if (name && !user.name) {
        user.name = name;
        changed = true;
      }
      if (changed) await user.save();
    }

    return res.status(200).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error("oauthUpsert error", err);
    return res.status(500).json({ error: "Failed to upsert OAuth user" });
  }
};
