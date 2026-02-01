import { Hono } from 'hono';
import type { Env } from '../types';

const token = new Hono<{ Bindings: Env }>();

token.post('/token', async (c) => {
  const { code } = await c.req.json<{ code: string }>();

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: c.env.VITE_DISCORD_CLIENT_ID,
      client_secret: c.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
    }),
  });

  const data = await response.json() as { access_token?: string; error?: string };

  if (!response.ok || data.error) {
    console.error('Token exchange failed:', data);
    return c.json({ error: data.error || 'Token exchange failed' }, 400);
  }

  return c.json({ access_token: data.access_token });
});

export default token;
