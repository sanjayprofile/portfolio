import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

function validTelegramPayload(user: TelegramUser, botToken: string) {
  const { hash, ...fields } = user;
  const dataCheckString = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHash('sha256').update(botToken).digest() as unknown as Uint8Array<ArrayBuffer>;
  const expected = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const received = Buffer.from(hash, 'hex') as unknown as Uint8Array<ArrayBuffer>;
  const calculated = Buffer.from(expected, 'hex') as unknown as Uint8Array<ArrayBuffer>;
  const age = Math.floor(Date.now() / 1000) - user.auth_date;
  return received.length === calculated.length && timingSafeEqual(received, calculated) && age >= 0 && age < 86400;
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const authSecret = process.env.AUTH_SECRET;
  if (!botToken || !authSecret) return response.status(500).send('Telegram authentication is not configured.');

  const user = request.query as unknown as TelegramUser;
  if (!user.id || !user.hash || !validTelegramPayload(user, botToken)) {
    return response.status(401).send('Invalid Telegram authentication.');
  }

  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    name: [user.first_name, user.last_name].filter(Boolean).join(' '),
    username: user.username,
    photoUrl: user.photo_url,
  })).toString('base64url');
  const signature = createHmac('sha256', authSecret).update(payload).digest('base64url');
  const session = `${payload}.${signature}`;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  response.setHeader('Set-Cookie', `telegram_session=${session}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=604800`);
  return response.redirect(302, '/auth');
}