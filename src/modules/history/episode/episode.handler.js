import { getCollections } from '../../../db/mongo.js';
import { requireUser } from '../../../auth/require-user.js';

export default async function historyEpisodeHandler(c) {
  const user = requireUser(c);
  const { episodeId } = c.req.valid('param');
  const { watchProgress } = await getCollections();

  const existing = await watchProgress.findOne({
    userId: user.id,
    episodeId,
  });

  if (!existing) {
    return {
      found: false,
      episodeId,
      currentTimeSec: 0,
      durationSec: 0,
      progressPercent: 0,
      status: null,
    };
  }

  return {
    found: true,
    episodeId,
    currentTimeSec: existing.currentTimeSec || 0,
    durationSec: existing.durationSec || 0,
    progressPercent: existing.progressPercent || 0,
    status: existing.status || 'watching',
  };
}
