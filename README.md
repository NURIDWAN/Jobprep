# JobPrep

Portal lowongan kerja dengan latihan interview AI spesifik untuk setiap lowongan.

## Stack
- Next.js App Router + TypeScript strict
- Tailwind CSS v4
- Supabase Auth, Postgres, Storage, dan RLS
- Gemini API melalui Route Handler server-side
- Zod dan React Hook Form siap untuk validasi form

## Menjalankan lokal

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Supabase

1. Buat project di Supabase.
2. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Jalankan isi `supabase/migrations/0001_initial.sql` melalui Supabase SQL Editor atau Supabase CLI:

```bash
supabase db push
```

4. Pastikan email auth dikonfigurasi untuk login/registrasi.
5. CV harus diunggah ke bucket private `cvs`; policy storage sudah disertakan di migration.

## Gemini

Isi `GEMINI_API_KEY` dan opsional `GEMINI_MODEL`. API key hanya dipakai di server Route Handler, tidak dikirim ke client.

## Email

`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, dan `NEXT_PUBLIC_APP_URL` disediakan untuk integrasi notifikasi status lamaran. Implementasi email production dapat ditambahkan pada Supabase Edge Function setelah kredensial Resend tersedia.

## Verifikasi

```bash
npm run lint
npm run build
```

## MVP implementation status

Implemented and verified locally:
- Responsive UI for landing, job listing/detail, interview, user/admin/recruiter dashboards, auth, and application form.
- Zod boundaries for jobs, interview answers, and application metadata.
- Server-only Gemini generate/evaluate route handlers with structured JSON fallback and rate-limit handling.
- Application multipart route with PDF/5MB validation, authenticated Supabase upload, insert, and cleanup on database failure.
- Interview session/question/answer routes with private-user ownership checks and persistent feedback.
- Public job search route and recruiter-owned job/applicant routes with Zod validation and status updates.
- Supabase migrations for core tables, RLS, private CV bucket, auth profile provisioning, and integrity hardening.

Requires configured external services for end-to-end verification:
- Supabase URL/anon key and applied migrations for Auth, Storage, and database persistence.
- Gemini API key to verify live AI generation/evaluation.
- Resend credentials and an email Edge Function for production status notifications.

The app intentionally reports configuration errors instead of treating fallback/demo data as production integration.