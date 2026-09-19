import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'node:crypto';

export default function handler(request: VercelRequest, response: VercelResponse) {
  const cookie = request.headers.cookie?.match(/(?:^|; )github_session=([^;]+)/)?.[1];
  const secret = process.env.AUTH_SECRET;
  if (!cookie || !secret) return response.status(200).json({ authenticated: false });
  try {
    const [payload, signature] = cookie.split('.');
    const expected = createHmac('sha256', secret).update(payload).digest('base64url');
    const received = Buffer.from(signature);
    const calculated = Buffer.from(expected);
    if (received.length !== calculated.length || !timingSafeEqual(received as unknown as Uint8Array<ArrayBuffer>, calculated as unknown as Uint8Array<ArrayBuffer>)) return response.status(200).json({ authenticated: false });
    return response.status(200).json({ authenticated: true, ...JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) });
  } catch {
    return response.status(200).json({ authenticated: false });
  }
}