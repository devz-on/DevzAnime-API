export function toWatchlistItem(doc) {
  return {
    animeId: doc.animeId,
    title: doc.title,
    image: doc.image,
    releaseDate: doc.releaseDate,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

export function normalizeWatchlistItem(input) {
  return {
    animeId: String(input.animeId || '').trim(),
    title: String(input.title || '').trim(),
    image: String(input.image || '').trim(),
    releaseDate: String(input.releaseDate || '').trim(),
  };
}
