import { createRoute, z } from '@hono/zod-openapi';

const progressBodySchema = z.object({
  animeId: z.string().trim().min(1),
  animeName: z.string().trim().min(1),
  animeImage: z.string().trim().optional(),
  episodeId: z.string().trim().min(1),
  episodeNumber: z.union([z.string().trim().min(1), z.number()]),
  episodeName: z.string().trim().min(1),
  currentTimeSec: z.number().min(0),
  durationSec: z.number().min(0),
});

const progressSchema = createRoute({
  method: 'put',
  path: '/history/progress',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: progressBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              status: z.enum(['watching', 'watched']),
              progressPercent: z.number(),
              currentTimeSec: z.number(),
              durationSec: z.number(),
              watchedAt: z.string().nullable(),
            }),
          }),
        },
      },
    },
  },
  description: 'Upsert user watch progress for an episode.',
});

export default progressSchema;
