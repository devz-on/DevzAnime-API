const WATCHED_THRESHOLD_PERCENT = 90;

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

export function normalizeProgressInput(payload) {
  const rawCurrent = Math.max(0, toFiniteNumber(payload.currentTimeSec, 0));
  const rawDuration = Math.max(0, toFiniteNumber(payload.durationSec, 0));
  const durationSec = rawDuration > 0 ? rawDuration : 0;
  const currentTimeSec =
    durationSec > 0
      ? Math.min(rawCurrent, durationSec)
      : Math.max(0, toFiniteNumber(payload.currentTimeSec, 0));
  const progressPercent = durationSec > 0 ? Math.min(100, (currentTimeSec / durationSec) * 100) : 0;
  const status =
    durationSec > 0 && progressPercent >= WATCHED_THRESHOLD_PERCENT ? 'watched' : 'watching';

  return {
    currentTimeSec: Number(currentTimeSec.toFixed(3)),
    durationSec: Number(durationSec.toFixed(3)),
    progressPercent: Number(progressPercent.toFixed(2)),
    status,
  };
}

export function toHistoryItem(doc) {
  return {
    animeId: doc.animeId,
    animeName: doc.animeName,
    animeImage: doc.animeImage || '',
    episodeId: doc.episodeId,
    episodeNumber: doc.episodeNumber,
    episodeName: doc.episodeName,
    currentTimeSec: doc.currentTimeSec,
    durationSec: doc.durationSec,
    progressPercent: doc.progressPercent,
    status: doc.status,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    watchedAt: doc.watchedAt ? new Date(doc.watchedAt).toISOString() : null,
  };
}

export function parsePositiveInt(value, fallback, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(max, Math.floor(parsed)));
}
