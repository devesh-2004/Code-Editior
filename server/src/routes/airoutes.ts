// server/src/routes/aiRoutes.ts
import { Router } from "express";
import { generateContent } from "../controllers/aicontroller";

const router = Router();

// Public endpoint — you can protect this with requireAuth if you want
router.post("/generate", generateContent);

export default router;
