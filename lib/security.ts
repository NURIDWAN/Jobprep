const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const requests = new Map<string, { count: number; resetAt: number }>();
const questionCache = new Map<string, { expiresAt: number; value: unknown }>();

export const hasSupabaseConfig = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const hasGeminiConfig = () => Boolean(process.env.GEMINI_API_KEY);

export function consumeRateLimit(key: string): boolean {
  const now = Date.now();
  const current = requests.get(key);
  if (!current || current.resetAt <= now) { requests.set(key, { count: 1, resetAt: now + WINDOW_MS }); return true; }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

export function getCachedQuestions(jobId: string): unknown | null {
  const cached = questionCache.get(jobId);
  if (!cached || cached.expiresAt <= Date.now()) { questionCache.delete(jobId); return null; }
  return cached.value;
}

export function cacheQuestions(jobId: string, value: unknown, ttlMs = 15 * 60_000): void {
  questionCache.set(jobId, { value, expiresAt: Date.now() + ttlMs });
}

export async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = 8_000): Promise<Response> {
  const signal = AbortSignal.timeout(timeoutMs);
  return fetch(input, { ...init, signal });
}
