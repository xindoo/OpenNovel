import type { Context, Next } from 'hono';
import type { Env } from './types';

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  // Workaround: crypto.subtle.timingSafeEqual is available in Cloudflare Workers
  // but TypeScript types might not recognize it in this environment
  return (crypto.subtle as any).timingSafeEqual(aBytes, bBytes);
}

export async function basicAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area", charset="UTF-8"'
      }
    });
  }

  const credentials = authHeader.slice('Basic '.length);
  const decoded = atob(credentials);
  const [username, password] = decoded.split(':', 2);

  if (!username || !password) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area", charset="UTF-8"'
      }
    });
  }

  const validUsername = await timingSafeEqual(username, c.env.ADMIN_USERNAME);
  const validPassword = await timingSafeEqual(password, c.env.ADMIN_PASSWORD);

  if (validUsername && validPassword) {
    await next();
    return;
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area", charset="UTF-8"'
    }
  });
}
