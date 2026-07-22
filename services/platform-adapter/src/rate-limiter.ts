import type { PlatformConnection } from '@cronus/domain';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export async function checkRateLimit(
  connection: PlatformConnection,
  config: RateLimitConfig,
): Promise<boolean> {
  const state = connection.rateLimitState ?? {};
  const now = Date.now();
  const windowStart = (state.windowStart as number) ?? 0;
  const callCount = (state.callCount as number) ?? 0;

  if (now - windowStart >= config.windowMs) {
    state.windowStart = now;
    state.callCount = 1;
    return false;
  }

  if (callCount >= config.maxRequests) {
    return true;
  }

  state.callCount = callCount + 1;
  return false;
}
