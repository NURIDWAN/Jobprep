import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { answerRequestSchema } from "@/lib/schemas";
import { buildEvaluationPrompt, extractGeminiText, parseEvaluation } from "@/lib/ai";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 }); }
  const parsed = answerRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Data jawaban tidak valid" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return NextResponse.json({ answer: null, evaluation: parseEvaluation("invalid"), source: "fallback" }, { status: 201 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk sebelum menyimpan jawaban" }, { status: 401 });
  const ownership = await supabase.from("interview_questions").select("id, question, interview_sessions!inner(user_id)").eq("id", parsed.data.questionId).eq("session_id", parsed.data.sessionId).eq("interview_sessions.user_id", user.id).single();
  if (ownership.error || !ownership.data) return NextResponse.json({ error: "Pertanyaan tidak ditemukan" }, { status: 404 });
  let evaluation = parseEvaluation("invalid");
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? "gemini-2.0-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: buildEvaluationPrompt(String(ownership.data.question), parsed.data.answer) }] }], generationConfig: { responseMimeType: "application/json" } }) });
      if (response.ok) evaluation = parseEvaluation(extractGeminiText(await response.json() as unknown));
    } catch { /* fallback evaluation remains safe and deterministic */ }
  }
  const inserted = await supabase.from("interview_answers").upsert({ question_id: parsed.data.questionId, answer_text: parsed.data.answer, score: { relevance: evaluation.relevance, starStructure: evaluation.starStructure, clarity: evaluation.clarity }, feedback_ai: evaluation }, { onConflict: "question_id" }).select("id, created_at").single();
  if (inserted.error) return NextResponse.json({ error: "Jawaban gagal disimpan" }, { status: 502 });
  return NextResponse.json({ answer: inserted.data, evaluation, source: process.env.GEMINI_API_KEY ? "gemini" : "fallback" }, { status: 201 });
}
