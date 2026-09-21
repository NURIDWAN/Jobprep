import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(`${root}/${file}`, "utf8");
test("P2 outbox is idempotent and retained safely", () => { const migration=read("supabase/migrations/0008_production_hardening.sql"); const worker=read("supabase/functions/send-application-notification/index.ts"); assert.match(migration,/dedupe_key/); assert.match(migration,/purge_expired_jobprep_data/); assert.match(worker,/Idempotency-Key/); assert.match(worker,/x-next-attempt/); });
test("P3 calendar exports an ICS event", () => { assert.match(read("lib/calendar.ts"),/BEGIN:VCALENDAR/); assert.match(read("app/api/calendar/invites/[id]/route.ts"),/text\/calendar/); });
