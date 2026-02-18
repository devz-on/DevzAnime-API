import { ObjectId } from 'mongodb';
import { AppError } from '../../utils/errors.js';

export function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function toPublicUser(userDoc) {
  if (!userDoc) {
    return null;
  }

  return {
    id: String(userDoc._id),
    email: userDoc.email,
    username: userDoc.username,
    createdAt: userDoc.createdAt ? new Date(userDoc.createdAt).toISOString() : null,
    lastLoginAt: userDoc.lastLoginAt ? new Date(userDoc.lastLoginAt).toISOString() : null,
  };
}

export function toObjectIdOrThrow(id) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('unauthorized', 401);
  }
  return new ObjectId(id);
}
