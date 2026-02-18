import { createRoute, z } from '@hono/zod-openapi';

const episodeSchema = createRoute({
  method: 'get',
  path: '/history/episode/{episodeId}',
  request: {
    params: z.object({
      episodeId: z.string().trim().min(1),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              found: z.boolean(),
              episodeId: z.string(),
              currentTimeSec: z.number(),
              durationSec: z.number(),
              progressPercent: z.number(),
              status: z.enum(['watching', 'watched']).nullable(),
            }),
          }),
        },
      },
    },
  },
  description: 'Get saved resume progress for one episode.',
});

export default episodeSchema;
