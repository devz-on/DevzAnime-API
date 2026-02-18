import { createHmac, timingSafeEqual } from 'node:crypto';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { AppError } from '../utils/errors.js';

function getRuntimeEnv() {
  const processEnv = typeof process !== 'undefined' && process?.env ? process.env : {};
  const workerEnv =
    typeof globalThis !== 'undefined' &&
    globalThis.__APP_RUNTIME_ENV__ &&
    typeof globalThis.__APP_RUNTIME_ENV__ === 'object'
      ? globalThis.__APP_RUNTIME_ENV__
      : {};

  return {
    ...processEnv,
    ...workerEnv,
  };
}

function getAuthConfig() {
  const env = getRuntimeEnv();
  const jwtSecret = String(env.AUTH_JWT_SECRET || '').trim();
  if (!jwtSecret) {
    throw new AppError('auth not configured', 500, {
      message: 'AUTH_JWT_SECRET is required',
    });
  }

  const cookieName = String(env.AUTH_COOKIE_NAME || 'dz_auth').trim() || 'dz_auth';
  const parsedMaxAge = Number(env.AUTH_COOKIE_MAX_AGE_SECONDS);
  const cookieMaxAgeSeconds = Number.isFinite(parsedMaxAge)
    ? Math.max(60, Math.floor(parsedMaxAge))
    : 7 * 24 * 60 * 60;
  const secureCookie = String(env.AUTH_SECURE_COOKIE || '1').trim() !== '0';

  return {
    jwtSecret,
    cookieName,
    cookieMaxAgeSeconds,
    secureCookie,
  };
}

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4 || 4)) % 4);
  return Buffer.from(padded, 'base64');
}

function createSignature(input, secret) {
  return createHmac('sha256', secret).update(input).digest();
}

function signToken(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = toBase64Url(createSignature(signingInput, secret));

  return `${signingInput}.${signature}`;
}

function verifyToken(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  let decodedHeader;
  let decodedPayload;
  let providedSignature;
  try {
    decodedHeader = JSON.parse(fromBase64Url(encodedHeader).toString('utf8'));
    decodedPayload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8'));
    providedSignature = fromBase64Url(encodedSignature);
  } catch {
    return null;
  }

  if (!decodedHeader || decodedHeader.alg !== 'HS256' || decodedHeader.typ !== 'JWT') {
    return null;
  }

  const expectedSignature = createSignature(signingInput, secret);
  if (providedSignature.length !== expectedSignature.length) {
    return null;
  }
  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof decodedPayload?.exp !== 'number' || decodedPayload.exp <= now) {
    return null;
  }

  return decodedPayload;
}

function getCookieOptions({ cookieMaxAgeSeconds, secureCookie }) {
  return {
    path: '/',
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'Lax',
    maxAge: cookieMaxAgeSeconds,
  };
}

export function createSessionToken(user) {
  const { jwtSecret, cookieMaxAgeSeconds } = getAuthConfig();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    iat: now,
    exp: now + cookieMaxAgeSeconds,
  };
  return signToken(payload, jwtSecret);
}

export function setAuthCookie(c, token) {
  const { cookieName, cookieMaxAgeSeconds, secureCookie } = getAuthConfig();
  setCookie(c, cookieName, token, getCookieOptions({ cookieMaxAgeSeconds, secureCookie }));
}

export function clearAuthCookie(c) {
  const { cookieName, secureCookie } = getAuthConfig();
  deleteCookie(c, cookieName, {
    path: '/',
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'Lax',
  });
}

export function readSessionFromRequest(c) {
  const { cookieName, jwtSecret } = getAuthConfig();
  const rawToken = getCookie(c, cookieName);
  if (!rawToken) {
    return null;
  }
  return verifyToken(rawToken, jwtSecret);
}
