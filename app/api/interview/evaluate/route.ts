import { NextResponse } from "next/server";
import { buildEvaluationPrompt, extractGeminiText, parseEvaluation } from "@/lib/ai";
import { answerRequestSchema } from "@/lib/schemas";
import { consumeRateLimit, fetchWithTimeout, hasGeminiConfig } from "@/lib/security";
export async function POST(request: Request) {
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 }); }
  const parsed = answerRequestSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Data jawaban tidak valid" }, { status: 400 });
  if (!hasGeminiConfig()) return NextResponse.json({ error: "AI belum dikonfigurasi" }, { status: 503 });
  if (!consumeRateLimit(`evaluate:${parsed.data.sessionId}`)) return NextResponse.json({ error: "Terlalu banyak permintaan AI. Coba lagi nanti." }, { status: 429 });
  try {
    const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? "gemini-2.0-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: buildEvaluationPrompt("Pertanyaan interview", parsed.data.answer) }] }], generationConfig: { responseMimeType: "application/json" } }) });
    if (!response.ok) return NextResponse.json({ error: response.status === 429 ? "Batas penggunaan AI tercapai." : "Evaluasi AI gagal." }, { status: response.status === 429 ? 429 : 502 });
    return NextResponse.json({ evaluation: parseEvaluation(extractGeminiText(await response.json() as unknown)), source: "gemini" });
  } catch { return NextResponse.json({ error: "AI timeout atau tidak dapat dihubungi." }, { status: 504 }); }
}
