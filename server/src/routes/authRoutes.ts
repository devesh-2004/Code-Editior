// server/src/routes/authRoutes.ts
import { Router } from "express";
import {
  signup,
  login,
  logout,
  getCurrentUser,
  githubLogin,
  githubAuthCallback,
  oauthUpsert,
} from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

/* -------------------------------
   OAuth: GitHub Authentication
--------------------------------*/
router.get("/oauth/github", githubLogin); // Step 1: Redirect to GitHub
router.get("/oauth/github/callback", githubAuthCallback); // Step 2: GitHub redirects back

/* -------------------------------
   Generic OAuth Upsert (NextAuth)
--------------------------------*/
router.post("/oauth/upsert", oauthUpsert);

/* -------------------------------
   Email/Password Authentication
--------------------------------*/
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

/* -------------------------------
   Protected Route
--------------------------------*/
router.get("/me", requireAuth, getCurrentUser);

export default router;