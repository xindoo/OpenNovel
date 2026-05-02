import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import publicRouter from './routes/public';
import adminRouter from './routes/admin';

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api', publicRouter);
app.route('/api/admin', adminRouter);

export default app;
