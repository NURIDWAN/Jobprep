import { NextResponse } from "next/server";
import { applicationMetadataSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

const MAX_CV_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Request harus berupa multipart/form-data" }, { status: 400 }); }
  const metadata = applicationMetadataSchema.safeParse({ jobId: form.get("jobId"), coverLetter: form.get("coverLetter") ?? "" });
  const cv = form.get("cv");
  if (!metadata.success) return NextResponse.json({ error: "Data lamaran tidak valid", details: metadata.error.flatten() }, { status: 400 });
  if (!(cv instanceof File)) return NextResponse.json({ error: "CV wajib diunggah dalam format PDF" }, { status: 400 });
  if (cv.type !== "application/pdf" || !cv.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "CV harus berupa file PDF" }, { status: 400 });
  if (cv.size === 0 || cv.size > MAX_CV_BYTES) return NextResponse.json({ error: "Ukuran CV harus antara 1 byte dan 5MB" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return NextResponse.json({ error: "Supabase belum dikonfigurasi", source: "configuration" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk sebelum melamar" }, { status: 401 });
  const safeName = cv.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
  const upload = await supabase.storage.from("cvs").upload(path, cv, { contentType: "application/pdf", upsert: false });
  if (upload.error) return NextResponse.json({ error: "Upload CV gagal" }, { status: 502 });
  const inserted = await supabase.from("applications").insert({ job_id: metadata.data.jobId, user_id: user.id, cv_url: path, cover_letter: metadata.data.coverLetter || null }).select("id, status, created_at").single();
  if (inserted.error) { await supabase.storage.from("cvs").remove([path]); const duplicate = inserted.error.code === "23505" || inserted.error.message.toLowerCase().includes("duplicate"); return NextResponse.json({ error: duplicate ? "Kamu sudah melamar lowongan ini" : "Lamaran gagal disimpan" }, { status: duplicate ? 409 : 502 }); }
  return NextResponse.json({ application: inserted.data }, { status: 201 });
}
