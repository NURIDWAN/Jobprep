import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recommendationQuerySchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const raw = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = recommendationQuerySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Filter rekomendasi tidak valid" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return NextResponse.json({ jobs: [], source: "fallback" });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const profile = await supabase.from("profiles").select("bio").eq("id", user.id).single();
  let query = supabase.from("jobs").select("*,companies(id,name,logo_url)").eq("status", "published").limit(parsed.data.limit);
  if (parsed.data.level) query = query.eq("level", parsed.data.level);
  if (parsed.data.workType) query = query.eq("work_type", parsed.data.workType);
  if (parsed.data.query) query = query.or(`title.ilike.%${parsed.data.query}%,description.ilike.%${parsed.data.query}%,industry.ilike.%${parsed.data.query}%`);
  const result = await query;
  if (result.error) return NextResponse.json({ error: "Rekomendasi gagal dimuat" }, { status: 502 });
  const bio = (profile.data?.bio ?? "").toLowerCase();
  const jobs = (result.data ?? []).map((job) => {
    const text = `${job.title} ${job.description} ${job.industry}`.toLowerCase();
    const terms: string[] = bio.split(/\W+/).filter(Boolean);
    const matched = terms.filter((term) => term.length > 3 && text.includes(term)).length;
    return { ...job, matchScore: Math.min(99, 60 + matched * 8) };
  }).sort((a, b) => b.matchScore - a.matchScore);
  return NextResponse.json({ jobs, source: "supabase" });
}
