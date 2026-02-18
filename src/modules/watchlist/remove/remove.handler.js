import { getCollections } from '../../../db/mongo.js';
import { requireUser } from '../../../auth/require-user.js';

export default async function watchlistRemoveHandler(c) {
  const user = requireUser(c);
  const { animeId } = c.req.valid('param');
  const { watchlist } = await getCollections();

  const result = await watchlist.deleteOne({
    userId: user.id,
    animeId,
  });

  return {
    removed: result.deletedCount > 0,
  };
}
