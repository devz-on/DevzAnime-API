import { MongoClient } from 'mongodb';
import { AppError } from '../utils/errors.js';

let mongoClient = null;
let database = null;
let connectPromise = null;
let indexPromise = null;

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

function getMongoConfig() {
  const env = getRuntimeEnv();
  const uri = String(env.MONGODB_URI || '').trim();
  const dbName = String(env.MONGODB_DB_NAME || 'devzanime').trim() || 'devzanime';

  if (!uri) {
    throw new AppError('database not configured', 500, {
      message: 'MONGODB_URI is required',
    });
  }

  return {
    uri,
    dbName,
  };
}

async function ensureIndexes(db) {
  if (indexPromise) {
    return indexPromise;
  }

  indexPromise = (async () => {
    const users = db.collection('users');
    const watchProgress = db.collection('watch_progress');
    const watchlist = db.collection('watchlist');

    await users.createIndexes([
      { key: { emailLower: 1 }, unique: true, name: 'users_email_lower_unique' },
      { key: { usernameLower: 1 }, unique: true, name: 'users_username_lower_unique' },
    ]);

    await watchProgress.createIndexes([
      {
        key: { userId: 1, episodeId: 1 },
        unique: true,
        name: 'watch_progress_user_episode_unique',
      },
      {
        key: { userId: 1, status: 1, updatedAt: -1 },
        name: 'watch_progress_user_status_updated_at',
      },
    ]);

    await watchlist.createIndexes([
      {
        key: { userId: 1, animeId: 1 },
        unique: true,
        name: 'watchlist_user_anime_unique',
      },
      {
        key: { userId: 1, updatedAt: -1 },
        name: 'watchlist_user_updated_at',
      },
    ]);
  })().catch((error) => {
    indexPromise = null;
    throw error;
  });

  return indexPromise;
}

export async function getDb() {
  if (database) {
    return database;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    const { uri, dbName } = getMongoConfig();

    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    database = mongoClient.db(dbName);
    await ensureIndexes(database);

    return database;
  })().catch((error) => {
    connectPromise = null;
    database = null;
    mongoClient = null;
    throw error;
  });

  return connectPromise;
}

export async function getCollections() {
  const db = await getDb();
  return {
    users: db.collection('users'),
    watchProgress: db.collection('watch_progress'),
    watchlist: db.collection('watchlist'),
  };
}
