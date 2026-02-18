import { AppError } from '../../../utils/errors.js';
import { getCollections } from '../../../db/mongo.js';
import { hashPassword } from '../../../auth/password.js';
import { createSessionToken, setAuthCookie } from '../../../auth/session.js';
import { normalizeEmail, normalizeUsername, toPublicUser } from '../auth.utils.js';

export default async function registerHandler(c) {
  const { email, username, password } = c.req.valid('json');

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);

  const { users } = await getCollections();
  const now = new Date();

  const existingUser = await users.findOne({
    $or: [{ emailLower: normalizedEmail }, { usernameLower: normalizedUsername }],
  });

  if (existingUser) {
    throw new AppError('unable to register with provided credentials', 409);
  }

  const passwordHash = await hashPassword(password);

  try {
    const result = await users.insertOne({
      email: String(email).trim(),
      emailLower: normalizedEmail,
      username: String(username).trim(),
      usernameLower: normalizedUsername,
      passwordHash,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });

    const user = {
      _id: result.insertedId,
      email: String(email).trim(),
      username: String(username).trim(),
      createdAt: now,
      lastLoginAt: now,
    };
    const publicUser = toPublicUser(user);
    const token = createSessionToken(publicUser);
    setAuthCookie(c, token);

    return {
      user: publicUser,
    };
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 11000) {
      throw new AppError('unable to register with provided credentials', 409);
    }
    throw error;
  }
}
