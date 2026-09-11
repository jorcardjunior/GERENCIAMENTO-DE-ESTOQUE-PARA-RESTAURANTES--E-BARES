const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }

  record.count++;
  if (record.count > maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  return { allowed: true, remaining: maxAttempts - record.count, resetAt: record.resetAt };
}

export function rateLimitIP(request: Request, maxAttempts = 5, windowMs = 60_000) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return rateLimit(`ip:${ip}`, maxAttempts, windowMs);
}
