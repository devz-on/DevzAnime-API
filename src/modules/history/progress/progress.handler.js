import { getCollections } from '../../../db/mongo.js';
import { requireUser } from '../../../auth/require-user.js';
import { normalizeProgressInput } from '../history.utils.js';

export default async function progressHandler(c) {
  const user = requireUser(c);
  const payload = c.req.valid('json');
  const normalized = normalizeProgressInput(payload);
  const { watchProgress } = await getCollections();

  const now = new Date();
  const existing = await watchProgress.findOne({
    userId: user.id,
    episodeId: payload.episodeId,
  });

  const watchedAt =
    normalized.status === 'watched'
      ? existing?.watchedAt
        ? new Date(existing.watchedAt)
        : now
      : null;

  await watchProgress.updateOne(
    {
      userId: user.id,
      episodeId: payload.episodeId,
    },
    {
      $set: {
        animeId: payload.animeId,
        animeName: payload.animeName,
        animeImage: payload.animeImage || '',
        episodeId: payload.episodeId,
        episodeNumber: String(payload.episodeNumber),
        episodeName: payload.episodeName,
        currentTimeSec: normalized.currentTimeSec,
        durationSec: normalized.durationSec,
        progressPercent: normalized.progressPercent,
        status: normalized.status,
        updatedAt: now,
        watchedAt,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    {
      upsert: true,
    }
  );

  return {
    status: normalized.status,
    progressPercent: normalized.progressPercent,
    currentTimeSec: normalized.currentTimeSec,
    durationSec: normalized.durationSec,
    watchedAt: watchedAt ? watchedAt.toISOString() : null,
  };
}
