import { createRoute, z } from '@hono/zod-openapi';

const removeSchema = createRoute({
  method: 'delete',
  path: '/watchlist/{animeId}',
  request: {
    params: z.object({
      animeId: z.string().trim().min(1),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              removed: z.boolean(),
            }),
          }),
        },
      },
    },
  },
  description: 'Remove an anime from authenticated user watchlist.',
});

export default removeSchema;
