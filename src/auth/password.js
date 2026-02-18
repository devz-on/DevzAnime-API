import bcrypt from 'bcryptjs';

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

function getSaltRounds() {
  const env = getRuntimeEnv();
  const parsed = Number(env.AUTH_BCRYPT_SALT_ROUNDS);
  if (!Number.isFinite(parsed)) {
    return 12;
  }
  return Math.max(8, Math.min(14, Math.floor(parsed)));
}

export async function hashPassword(password) {
  return bcrypt.hash(password, getSaltRounds());
}

export async function verifyPassword(password, hash) {
  if (!hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}
