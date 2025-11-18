import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { language, source, stdin = "" } = req.body;

  try {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version: "latest",
        files: [{ content: source }],
        stdin,
      }),
    });

    const data = await response.json();
    const out = data.run?.output ?? data.run?.stdout ?? "";

    res.status(200).json({ output: out, raw: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}