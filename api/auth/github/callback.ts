import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

type GitHubUser = { id: number; login: string; name: string | null; avatar_url: string };

function sessionCookie(user: GitHubUser, secret: string) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, username: user.login, name: user.name ?? user.login, avatarUrl: user.avatar_url })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const authSecret = process.env.AUTH_SECRET;
  const { code, state } = request.query;
  const cookieState = request.headers.cookie?.match(/(?:^|; )github_oauth_state=([^;]+)/)?.[1];
  if (!clientId || !clientSecret || !authSecret || typeof code !== 'string' || typeof state !== 'string' || state !== cookieState) {
    return response.status(400).send('Invalid GitHub authentication request.');
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, state }),
  });
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) return response.status(401).send('GitHub authentication failed.');

  const userResponse = await fetch('https://api.github.com/user', { headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'portfolio' } });
  if (!userResponse.ok) return response.status(401).send('Unable to load GitHub profile.');
  const user = await userResponse.json() as GitHubUser;
  const session = sessionCookie(user, authSecret);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', [`github_session=${session}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=604800`, 'github_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0']);
  return response.redirect(302, '/auth');
}