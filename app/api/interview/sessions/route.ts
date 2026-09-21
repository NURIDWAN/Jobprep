import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { interviewRequestSchema } from "@/lib/schemas";
import { buildQuestionPrompt, extractGeminiText, parseGeneratedQuestions } from "@/lib/ai";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return NextResponse.json({ sessions: [], source: "fallback" });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const result = await supabase.from("interview_sessions").select("id, job_id, status, summary_feedback, created_at, interview_questions(id, question, category, ordering, interview_answers(id, answer_text, score, feedback_ai))").eq("user_id", user.id).order("created_at", { ascending: false });
  if (result.error) return NextResponse.json({ error: "Riwayat gagal dimuat" }, { status: 502 });
  return NextResponse.json({ sessions: result.data, source: "supabase" });
}

export async function POST(request: Request) {
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 }); }
  const parsed = interviewRequestSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "jobId tidak valid" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Silakan masuk sebelum memulai sesi" }, { status: 401 });
  const session = await supabase.from("interview_sessions").insert({ job_id: parsed.data.jobId, user_id: user.id }).select("id, status, created_at").single(); if (session.error) return NextResponse.json({ error: "Sesi interview gagal dibuat" }, { status: 502 });
  const job = await supabase.from("jobs").select("title,description,qualifications,level,industry").eq("id", parsed.data.jobId).single();
  if (job.error || !job.data) return NextResponse.json({ error: "Lowongan tidak ditemukan" }, { status: 404 });
  let questions = parseGeneratedQuestions("invalid");
  if (process.env.GEMINI_API_KEY) { try { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? "gemini-2.0-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: buildQuestionPrompt(job.data) }] }], generationConfig: { responseMimeType: "application/json" } }) }); if (response.ok) questions = parseGeneratedQuestions(extractGeminiText(await response.json() as unknown)); } catch { /* fallback */ } }
  const questionRows = questions.map((item, ordering) => ({ session_id: session.data.id, question: item.question, category: item.category, ordering })); const questionInsert = await supabase.from("interview_questions").insert(questionRows).select("id, question, category, ordering");
  if (questionInsert.error) { await supabase.from("interview_sessions").delete().eq("id", session.data.id); return NextResponse.json({ error: "Pertanyaan interview gagal dibuat" }, { status: 502 }); }
  return NextResponse.json({ session: session.data, questions: questionInsert.data, source: process.env.GEMINI_API_KEY ? "gemini" : "fallback" }, { status: 201 });
}
