import { AppError } from '../utils/errors.js';
import { readSessionFromRequest } from './session.js';

export function requireUser(c) {
  const session = readSessionFromRequest(c);
  if (!session?.sub) {
    throw new AppError('unauthorized', 401);
  }

  return {
    id: String(session.sub),
    email: String(session.email || ''),
    username: String(session.username || ''),
  };
}
