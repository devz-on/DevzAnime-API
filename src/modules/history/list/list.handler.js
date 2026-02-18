import { getCollections } from '../../../db/mongo.js';
import { requireUser } from '../../../auth/require-user.js';
import { parsePositiveInt, toHistoryItem } from '../history.utils.js';

export default async function historyListHandler(c) {
  const user = requireUser(c);
  const { watchingLimit, watchedLimit } = c.req.valid('query');
  const { watchProgress } = await getCollections();

  const safeWatchingLimit = parsePositiveInt(watchingLimit, 20, 100);
  const safeWatchedLimit = parsePositiveInt(watchedLimit, 20, 100);

  const [watching, watched] = await Promise.all([
    watchProgress
      .find({ userId: user.id, status: 'watching' })
      .sort({ updatedAt: -1 })
      .limit(safeWatchingLimit)
      .toArray(),
    watchProgress
      .find({ userId: user.id, status: 'watched' })
      .sort({ watchedAt: -1, updatedAt: -1 })
      .limit(safeWatchedLimit)
      .toArray(),
  ]);

  return {
    watching: watching.map(toHistoryItem),
    watched: watched.map(toHistoryItem),
  };
}
