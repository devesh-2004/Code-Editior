import { Router } from "express";
import {signup,login,getCurrentUser,logout,githubCallback,githubLogin, oauthUpsert} from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// GitHub Authentication Routes
router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

// OAuth upsert for NextAuth flows
router.post("/oauth/upsert", oauthUpsert);

// Regular Email/Password Routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Protected Route: This route requires authentication
router.get("/me", requireAuth, getCurrentUser);

export default router;
