import { getCollections } from '../../../db/mongo.js';
import { requireUser } from '../../../auth/require-user.js';
import { toWatchlistItem } from '../watchlist.utils.js';

export default async function watchlistListHandler(c) {
  const user = requireUser(c);
  const { watchlist } = await getCollections();

  const items = await watchlist.find({ userId: user.id }).sort({ updatedAt: -1 }).toArray();

  return {
    items: items.map(toWatchlistItem),
  };
}
