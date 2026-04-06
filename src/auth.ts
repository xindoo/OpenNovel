import type { Context, Next } from 'hono';
import type { Env } from './types';

async function timingSafeEqual(a: Uint8Array, b: Uint8Array): Promise<boolean> {
  const subtle = crypto.subtle as unknown as {
    timingSafeEqual: (a: Uint8Array, b: Uint8Array) => Promise<ArrayBuffer>;
  };
  const result = await subtle.timingSafeEqual(a, b);
  const view = new Uint8Array(result);
  let diff = 0;
  for (const byte of view) {
    diff |= byte;
  }
  return diff === 0;
}

async function constantTimeCompareStrings(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  
  // Always compare with max length to avoid timing leakage on length mismatch
  const maxLen = Math.max(aBytes.length, bBytes.length);
  const paddedA = new Uint8Array(maxLen);
  const paddedB = new Uint8Array(maxLen);
  
  paddedA.set(aBytes);
  paddedB.set(bBytes);
  
  return timingSafeEqual(paddedA, paddedB);
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

  // Default to empty strings if missing to allow constant-time comparison
  const usernameInput = username || '';
  const passwordInput = password || '';

  // Compare both in constant time - never fail early based on length
  const validUsername = await constantTimeCompareStrings(usernameInput, c.env.ADMIN_USERNAME);
  const validPassword = await constantTimeCompareStrings(passwordInput, c.env.ADMIN_PASSWORD);

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
