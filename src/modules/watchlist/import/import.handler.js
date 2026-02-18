import { getCollections } from '../../../db/mongo.js';
import { requireUser } from '../../../auth/require-user.js';
import { normalizeWatchlistItem } from '../watchlist.utils.js';

export default async function watchlistImportHandler(c) {
  const user = requireUser(c);
  const { items } = c.req.valid('json');
  const { watchlist } = await getCollections();
  const received = Array.isArray(items) ? items.length : 0;

  const deduped = new Map();
  for (const rawItem of items || []) {
    const item = normalizeWatchlistItem(rawItem);
    if (!item.animeId || !item.title || !item.image || !item.releaseDate) {
      continue;
    }
    deduped.set(item.animeId, item);
  }

  const validItems = Array.from(deduped.values());
  const now = new Date();

  if (!validItems.length) {
    return {
      received,
      processed: 0,
      upserted: 0,
      modified: 0,
      matched: 0,
      invalid: received,
    };
  }

  const operations = validItems.map((item) => ({
    updateOne: {
      filter: {
        userId: user.id,
        animeId: item.animeId,
      },
      update: {
        $set: {
          userId: user.id,
          animeId: item.animeId,
          title: item.title,
          image: item.image,
          releaseDate: item.releaseDate,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      upsert: true,
    },
  }));

  const result = await watchlist.bulkWrite(operations, { ordered: false });

  return {
    received,
    processed: validItems.length,
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
    matched: result.matchedCount || 0,
    invalid: received - validItems.length,
  };
}
