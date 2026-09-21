import { z } from "zod";

export const roleSchema = z.enum(["job_seeker", "recruiter"]);
export const jobLevelSchema = z.enum(["entry", "mid", "senior", "lead"]);
export const workTypeSchema = z.enum(["remote", "hybrid", "onsite"]);
export const jobStatusSchema = z.enum(["draft", "published", "closed"]);
export const applicationStatusSchema = z.enum(["new", "reviewed", "interview", "rejected", "accepted"]);
export const questionCategorySchema = z.enum(["behavioral", "technical", "situational"]);

export const jobSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(30).max(10000),
  qualifications: z.string().trim().min(10).max(5000),
  level: jobLevelSchema,
  industry: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(120),
  workType: workTypeSchema,
  salaryMin: z.coerce.number().int().nonnegative().optional(),
  salaryMax: z.coerce.number().int().nonnegative().optional(),
  status: jobStatusSchema.default("published"),
}).refine((data) => !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin, {
  message: "Gaji maksimum harus lebih besar atau sama dengan minimum",
  path: ["salaryMax"],
});

export const interviewRequestSchema = z.object({ jobId: z.string().uuid() });
export const answerRequestSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.string().trim().min(10).max(5000),
});

export const applicationMetadataSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().trim().max(5000).optional().default(""),
});

export const notificationStatusSchema = z.object({ applicationId: z.string().uuid(), status: applicationStatusSchema });
export const interviewInviteSchema = z.object({ applicationId: z.string().uuid(), startsAt: z.string().datetime(), durationMinutes: z.number().int().min(15).max(180).default(45), meetingUrl: z.string().url().optional(), notes: z.string().max(2000).optional() });
export const recommendationQuerySchema = z.object({ query: z.string().trim().max(120).optional(), level: jobLevelSchema.optional(), workType: workTypeSchema.optional(), limit: z.coerce.number().int().min(1).max(20).default(10) });

export const candidatePreferencesSchema = z.object({ skills: z.array(z.string().trim().min(1).max(80)).max(30).default([]), industries: z.array(z.string().trim().min(1).max(80)).max(20).default([]), preferredLocations: z.array(z.string().trim().min(1).max(120)).max(20).default([]), preferredWorkTypes: z.array(workTypeSchema).max(3).default([]), preferredLevels: z.array(jobLevelSchema).max(4).default([]) });
export const recommendationInteractionSchema = z.object({ jobId: z.string().uuid(), interaction: z.enum(["view", "save", "apply", "dismiss"]) });
export const analyticsEventSchema = z.object({ eventName: z.string().trim().regex(/^[a-z][a-z0-9_.-]{1,80}$/), properties: z.record(z.string(), z.unknown()).default({}) });
export const calendarQuerySchema = z.object({ startsAt: z.string().datetime(), endsAt: z.string().datetime() });

export type JobInput = z.infer<typeof jobSchema>;
export type QuestionCategory = z.infer<typeof questionCategorySchema>;
