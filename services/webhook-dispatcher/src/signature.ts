import crypto from 'node:crypto';

export function computeHmacSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  return `sha256=${hmac.update(payload).digest('hex')}`;
}

export function verifyHmacSignature(payload: string, secret: string, signature: string): boolean {
  const expectedSignature = computeHmacSignature(payload, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
