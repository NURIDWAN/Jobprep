import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("..", import.meta.url).pathname;
const read = (file: string) => readFileSync(`${root}/${file}`, "utf8");

test("AI routes fail closed without Gemini", () => {
  for (const file of ["app/api/interview/generate/route.ts", "app/api/interview/evaluate/route.ts"]) {
    const source = read(file);
    assert.match(source, /status: 400/);
    assert.match(source, /AI belum dikonfigurasi/);
    assert.match(source, /status: 503/);
  }
});

test("persistence routes fail closed without Supabase", () => {
  for (const file of ["app/api/jobs/route.ts", "app/api/notifications/route.ts", "app/api/applications/route.ts"]) {
    const source = read(file);
    assert.match(source, /Supabase belum dikonfigurasi/);
    assert.match(source, /status: 503/);
  }
});

test("AI protections are wired", () => {
  const security = read("lib/security.ts");
  const generate = read("app/api/interview/generate/route.ts");
  const evaluate = read("app/api/interview/evaluate/route.ts");
  assert.match(security, /MAX_REQUESTS = 10/);
  assert.match(security, /fetchWithTimeout/);
  assert.match(generate, /consumeRateLimit/);
  assert.match(generate, /getCachedQuestions/);
  assert.match(evaluate, /consumeRateLimit/);
});

test("privacy migration scopes recruiter metadata and locks application identity", () => {
  const migration = read("supabase/migrations/0005_mvp_constraints.sql");
  assert.match(migration, /recruiter reads applicant metadata on owned jobs/);
  assert.match(migration, /prevent_application_identity_change/);
  assert.match(migration, /applications_job_user_idx/);
});
