import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';

export default function handler(request: VercelRequest, response: VercelResponse) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return response.status(500).send('GitHub authentication is not configured.');

  const state = randomBytes(24).toString('hex');
  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto ?? 'https';
  const host = request.headers.host;
  const redirectUri = `${protocol}://${host}/api/auth/github/callback`;
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope: 'read:user user:email', state });

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `github_oauth_state=${state}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=600`);
  return response.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}