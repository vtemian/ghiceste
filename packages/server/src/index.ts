import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import token from './routes/token';
import game from './routes/game';
import leaderboard from './routes/leaderboard';

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors());

app.route('/api', token);
app.route('/api', game);
app.route('/api/leaderboard', leaderboard);

app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
