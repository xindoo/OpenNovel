import type { Context, Next } from 'hono';
import type { Env } from './types';

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  // Both arrays must be the same length (caller ensures this via padding)
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

function constantTimeCompareStrings(a: string, b: string): boolean {
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

  // Reject if admin credentials are not configured
  if (!c.env.ADMIN_USERNAME || !c.env.ADMIN_PASSWORD) {
    console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment variables');
    return new Response('Internal Server Error', { status: 500 });
  }

  const credentials = authHeader.slice('Basic '.length);
  const decoded = atob(credentials);
  const [username, password] = decoded.split(':', 2);

  // Default to empty strings if missing to allow constant-time comparison
  const usernameInput = username || '';
  const passwordInput = password || '';

  // Compare both in constant time - never fail early based on length
  const validUsername = constantTimeCompareStrings(usernameInput, c.env.ADMIN_USERNAME);
  const validPassword = constantTimeCompareStrings(passwordInput, c.env.ADMIN_PASSWORD);

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
