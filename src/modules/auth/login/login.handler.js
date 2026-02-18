import { AppError } from '../../../utils/errors.js';
import { getCollections } from '../../../db/mongo.js';
import { verifyPassword } from '../../../auth/password.js';
import { createSessionToken, setAuthCookie } from '../../../auth/session.js';
import { normalizeEmail, normalizeUsername, toPublicUser } from '../auth.utils.js';

export default async function loginHandler(c) {
  const { identifier, password } = c.req.valid('json');
  const normalizedIdentifier = String(identifier).trim();

  const { users } = await getCollections();
  const lowerEmail = normalizeEmail(normalizedIdentifier);
  const lowerUsername = normalizeUsername(normalizedIdentifier);

  const user = await users.findOne({
    $or: [{ emailLower: lowerEmail }, { usernameLower: lowerUsername }],
  });

  if (!user) {
    throw new AppError('invalid credentials', 401);
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError('invalid credentials', 401);
  }

  const now = new Date();
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        lastLoginAt: now,
        updatedAt: now,
      },
    }
  );

  const publicUser = toPublicUser({
    ...user,
    lastLoginAt: now,
  });
  const token = createSessionToken(publicUser);
  setAuthCookie(c, token);

  return {
    user: publicUser,
  };
}
