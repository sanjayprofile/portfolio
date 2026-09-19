import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'node:crypto';

export default function handler(request: VercelRequest, response: VercelResponse) {
  const cookie = request.headers.cookie?.match(/(?:^|; )telegram_session=([^;]+)/)?.[1];
  const authSecret = process.env.AUTH_SECRET;
  if (!cookie || !authSecret) return response.status(200).json({ authenticated: false });
  try {
    const [payload, signature] = cookie.split('.');
    if (!payload || !signature) return response.status(200).json({ authenticated: false });
    const expected = createHmac('sha256', authSecret).update(payload).digest('base64url');
    const received = Buffer.from(signature) as unknown as Uint8Array<ArrayBuffer>;
    const calculated = Buffer.from(expected) as unknown as Uint8Array<ArrayBuffer>;
    if (received.length !== calculated.length || !timingSafeEqual(received, calculated)) {
      return response.status(200).json({ authenticated: false });
    }
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return response.status(200).json({ authenticated: true, ...user });
  } catch {
    return response.status(200).json({ authenticated: false });
  }
}