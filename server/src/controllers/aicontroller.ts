// server/src/controllers/aicontroller.ts
import { Request, Response } from "express";
import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI endpoints will fail without it.");
}

/**
 * POST /api/ai/generate
 * body: { prompt: string, temperature?: number, maxOutputTokens?: number }
 */
export const generateContent = async (req: Request, res: Response) => {
  try {
    const { prompt, temperature = 0.2, maxOutputTokens = 8192 } = req.body ?? {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'prompt' in request body." });
    }

    if (!GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "Server not configured with GEMINI_API_KEY" });
    }

    // Build request body according to Gemini REST docs
    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    };

    // Use v1beta endpoint for new models
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    console.log(`[AI] Generating content with model: ${GEMINI_MODEL}`);

    const apiRes = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30_000,
    });

    const data = apiRes.data as any;
    const candidates = data?.candidates ?? data?.output ?? null;
    let textOut = "";

    if (Array.isArray(candidates) && candidates.length > 0) {
      const parts = candidates[0]?.content?.parts;
      if (Array.isArray(parts)) {
        textOut = parts.map((p: { text?: string }) => p?.text ?? "").join("\n");
      } else {
        textOut =
          candidates[0]?.text ??
          candidates[0]?.output ??
          JSON.stringify(candidates[0]);
      }
    } else if (typeof data?.text === "string") {
      textOut = data.text;
    } else {
      textOut = JSON.stringify(data);
    }

    return res.json({ text: textOut });
  } catch (err: any) {
    const errorData = err.response?.data || (err instanceof Error ? err.message : String(err));
    console.error(
      "AI generate error details:",
      JSON.stringify(errorData, null, 2)
    );
    const status = (err.response?.status) ?? 500;
    const message = errorData || { error: "AI generation failed" };
    return res.status(status).json({ error: message });
  }
};
