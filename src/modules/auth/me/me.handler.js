import { AppError } from '../../../utils/errors.js';
import { getCollections } from '../../../db/mongo.js';
import { requireUser } from '../../../auth/require-user.js';
import { clearAuthCookie } from '../../../auth/session.js';
import { toObjectIdOrThrow, toPublicUser } from '../auth.utils.js';

export default async function meHandler(c) {
  const sessionUser = requireUser(c);
  const { users } = await getCollections();

  const user = await users.findOne({ _id: toObjectIdOrThrow(sessionUser.id) });
  if (!user) {
    clearAuthCookie(c);
    throw new AppError('unauthorized', 401);
  }

  return {
    user: toPublicUser(user),
  };
}
