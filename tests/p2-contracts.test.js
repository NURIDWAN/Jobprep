import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(`${root}/${file}`, "utf8");
test("P2 voice and recruiter UI are wired to real states", () => { assert.match(read("components/voice-answer.tsx"), /\.stop\(\)/); assert.match(read("components/voice-answer.tsx"), /not-allowed/); assert.match(read("app/recruiter/RecruiterLiveDashboard.tsx"), /api\/recruiter\/applications/); assert.match(read("app/recruiter/RecruiterLiveDashboard.tsx"), /PATCH/); });
test("P2 email and status trigger are server-side", () => { assert.match(read("lib/email.ts"), /RESEND_API_KEY/); assert.match(read("supabase/functions/send-application-notification/index.ts"), /RESEND_API_KEY/); assert.match(read("supabase/migrations/0006_p2_email_outbox.sql"), /application_status_notification/); assert.match(read("supabase/migrations/0006_p2_email_outbox.sql"), /email_outbox/); });
test("P2 invites fail closed and validate payload", () => { const source = read("app/api/interview-invites/route.ts"); assert.match(source, /Data jadwal interview tidak valid/); assert.match(source, /Supabase belum dikonfigurasi/); assert.match(source, /sendEmail/); });
