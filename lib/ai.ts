import { questionCategorySchema, type QuestionCategory } from "@/lib/schemas";

export type GeneratedQuestion = {
  question: string;
  category: QuestionCategory;
};

export type Evaluation = {
  relevance: number;
  starStructure: number;
  clarity: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  feedback: string;
};

const fallbackQuestions: GeneratedQuestion[] = [
  { question: "Ceritakan pengalaman yang paling relevan dengan peran ini dan dampaknya.", category: "behavioral" },
  { question: "Bagaimana Anda akan menyelesaikan tantangan teknis utama dalam peran ini?", category: "technical" },
  { question: "Ceritakan saat Anda harus mengambil keputusan sulit dengan informasi terbatas.", category: "situational" },
  { question: "Bagaimana Anda mengukur keberhasilan pekerjaan Anda pada posisi ini?", category: "technical" },
  { question: "Ceritakan konflik dalam tim yang pernah Anda hadapi dan cara menyelesaikannya.", category: "behavioral" },
];

function parseJson<T>(text: string): T | null {
  try {
    const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    return JSON.parse(clean) as T;
  } catch {
    return null;
  }
}

export function extractGeminiText(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const root = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> };
  const text = root.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" ? text : "";
}

export function parseGeneratedQuestions(text: string): GeneratedQuestion[] {
  const parsed = parseJson<{ questions?: unknown }>(text);
  if (!parsed || !Array.isArray(parsed.questions)) return fallbackQuestions;
  const valid = parsed.questions.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const candidate = item as Record<string, unknown>;
    const result = questionCategorySchema.safeParse(candidate.category);
    return typeof candidate.question === "string" && result.success
      ? [{ question: candidate.question.trim(), category: result.data }]
      : [];
  });
  return valid.length >= 3 ? valid.slice(0, 8) : fallbackQuestions;
}

export function parseEvaluation(text: string): Evaluation {
  const parsed = parseJson<Partial<Evaluation>>(text) ?? {};
  const score = (value: unknown) => typeof value === "number" && value >= 1 && value <= 5 ? value : 3;
  return {
    relevance: score(parsed.relevance),
    starStructure: score(parsed.starStructure),
    clarity: score(parsed.clarity),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((v): v is string => typeof v === "string") : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((v): v is string => typeof v === "string") : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((v): v is string => typeof v === "string") : [],
    feedback: typeof parsed.feedback === "string" ? parsed.feedback : "Jawaban Anda sudah menjadi dasar yang baik. Tambahkan contoh konkret dan dampak yang terukur.",
  };
}

export function buildQuestionPrompt(job: Record<string, string>): string {
  return `Anda adalah interviewer profesional. Buat 5-8 pertanyaan interview untuk lowongan berikut. Campurkan behavioral, technical, dan situational sesuai level dan industri. Hanya jawab JSON valid dengan format {"questions":[{"question":"...","category":"behavioral|technical|situational"}]}.\nLowongan: ${JSON.stringify(job)}`;
}

export function buildEvaluationPrompt(question: string, answer: string): string {
  return `Evaluasi jawaban interview berikut. Hanya jawab JSON valid dengan field relevance, starStructure, clarity (angka 1-5), strengths, weaknesses, suggestions (array string), dan feedback (string). Nilai berdasarkan relevansi terhadap pertanyaan, struktur STAR, dan kejelasan.\nPertanyaan: ${question}\nJawaban: ${answer}`;
}
