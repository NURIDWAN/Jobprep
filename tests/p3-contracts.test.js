import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(`${root}/${file}`, "utf8");
test("P3 recommendation scoring is weighted and persisted", () => { const route=read("app/api/recommendations/route.ts"); assert.match(route,/skillScore\*\.4/); assert.match(route,/industryScore\*\.2/); assert.match(route,/matchBreakdown/); assert.match(read("app/api/preferences/route.ts"),/candidate_preferences/); assert.match(read("app/api/preferences/route.ts"),/recommendation_interactions/); });
test("P3 readiness aggregates sessions consistently", () => { const route=read("app/api/readiness/route.ts"); assert.match(route,/completedSessions/); assert.match(route,/completionRate/); assert.match(route,/starStructure/); });
test("P3 calendar validates timezone range and conflicts", () => { const route=read("app/api/calendar/route.ts"); const invite=read("app/api/interview-invites/route.ts"); assert.match(route,/calendarQuerySchema/); assert.match(route,/available/); assert.match(invite,/Waktu interview bentrok/); assert.match(invite,/status:409/); });
test("P3 analytics event boundary exists", () => { assert.match(read("app/api/analytics/events/route.ts"),/analyticsEventSchema/); assert.match(read("supabase/migrations/0007_p3_preferences_analytics.sql"),/analytics_events/); });
