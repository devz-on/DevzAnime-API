import { createRoute, z } from '@hono/zod-openapi';

const watchlistItemSchema = z.object({
  animeId: z.string(),
  title: z.string(),
  image: z.string(),
  releaseDate: z.string(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

const listSchema = createRoute({
  method: 'get',
  path: '/watchlist',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              items: z.array(watchlistItemSchema),
            }),
          }),
        },
      },
    },
  },
  description: 'Get authenticated user watchlist.',
});

export default listSchema;
