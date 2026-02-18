import { getCollections } from '../../../db/mongo.js';
import { requireUser } from '../../../auth/require-user.js';
import { normalizeWatchlistItem, toWatchlistItem } from '../watchlist.utils.js';

export default async function watchlistUpsertHandler(c) {
  const user = requireUser(c);
  const payload = normalizeWatchlistItem(c.req.valid('json'));
  const { watchlist } = await getCollections();

  const now = new Date();
  await watchlist.updateOne(
    {
      userId: user.id,
      animeId: payload.animeId,
    },
    {
      $set: {
        userId: user.id,
        animeId: payload.animeId,
        title: payload.title,
        image: payload.image,
        releaseDate: payload.releaseDate,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    {
      upsert: true,
    }
  );

  const stored = await watchlist.findOne({
    userId: user.id,
    animeId: payload.animeId,
  });

  return {
    item: toWatchlistItem(stored),
  };
}
