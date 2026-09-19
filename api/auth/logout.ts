import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  response.setHeader('Set-Cookie', 'github_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  return response.status(204).end();
}