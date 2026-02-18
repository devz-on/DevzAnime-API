import { createRoute, z } from '@hono/zod-openapi';

const historyItemSchema = z.object({
  animeId: z.string(),
  animeName: z.string(),
  animeImage: z.string(),
  episodeId: z.string(),
  episodeNumber: z.string(),
  episodeName: z.string(),
  currentTimeSec: z.number(),
  durationSec: z.number(),
  progressPercent: z.number(),
  status: z.enum(['watching', 'watched']),
  updatedAt: z.string().nullable(),
  watchedAt: z.string().nullable(),
});

const listSchema = createRoute({
  method: 'get',
  path: '/history',
  request: {
    query: z.object({
      watchingLimit: z.coerce.number().int().min(1).max(100).optional().default(20),
      watchedLimit: z.coerce.number().int().min(1).max(100).optional().default(20),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              watching: z.array(historyItemSchema),
              watched: z.array(historyItemSchema),
            }),
          }),
        },
      },
    },
  },
  description: 'Get continue watching and watched history for the authenticated user.',
});

export default listSchema;
