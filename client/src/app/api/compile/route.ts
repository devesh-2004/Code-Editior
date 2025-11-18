import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { language, source, stdin = "" } = await req.json();

    if (!language || !source) {
      return NextResponse.json(
        { error: "language and source required" },
        { status: 400 }
      );
    }

    // 🔥 Fetch available runtimes from piston
    const runtimesRes = await fetch("https://emkc.org/api/v2/piston/runtimes");
    const runtimes = await runtimesRes.json();

    const runtime = runtimes.find((r: any) => r.language === language);
    if (!runtime) {
      return NextResponse.json(
        { error: `Runtime not found for language: ${language}` },
        { status: 400 }
      );
    }

    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version: runtime.version, // ✅ always valid
        files: [{ content: source }],
        stdin,
      }),
    });

    const data = await response.json();

    const out =
      data.run?.output ??
      data.run?.stdout ??
      data.run?.stderr ??
      "⚠️ No output";

    return NextResponse.json({ output: out, raw: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}