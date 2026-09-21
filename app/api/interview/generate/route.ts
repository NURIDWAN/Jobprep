import { NextResponse } from "next/server";
import { buildQuestionPrompt, extractGeminiText, parseGeneratedQuestions } from "@/lib/ai";
import { interviewRequestSchema } from "@/lib/schemas";
import { cacheQuestions, consumeRateLimit, fetchWithTimeout, getCachedQuestions, hasGeminiConfig } from "@/lib/security";
export async function POST(request: Request) {
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 }); }
  const parsed = interviewRequestSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "jobId tidak valid" }, { status: 400 });
  if (!hasGeminiConfig()) return NextResponse.json({ error: "AI belum dikonfigurasi" }, { status: 503 });
  if (!consumeRateLimit(`generate:${parsed.data.jobId}`)) return NextResponse.json({ error: "Terlalu banyak permintaan AI. Coba lagi nanti." }, { status: 429 });
  const cached = getCachedQuestions(parsed.data.jobId); if (cached) return NextResponse.json({ questions: cached, source: "cache" });
  try {
    const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? "gemini-2.0-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: buildQuestionPrompt({ id: parsed.data.jobId }) }] }], generationConfig: { responseMimeType: "application/json" } }) });
    if (!response.ok) return NextResponse.json({ error: response.status === 429 ? "Batas penggunaan AI tercapai. Coba lagi nanti." : "AI sedang sibuk. Coba lagi." }, { status: response.status === 429 ? 429 : 502 });
    const questions = parseGeneratedQuestions(extractGeminiText(await response.json() as unknown)); cacheQuestions(parsed.data.jobId, questions); return NextResponse.json({ questions, source: "gemini" });
  } catch { return NextResponse.json({ error: "AI timeout atau tidak dapat dihubungi." }, { status: 504 }); }
}
