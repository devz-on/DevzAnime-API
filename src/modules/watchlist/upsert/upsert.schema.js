import { createRoute, z } from '@hono/zod-openapi';

const watchlistBodySchema = z.object({
  animeId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  image: z.string().trim().min(1),
  releaseDate: z.string().trim().min(1),
});

const watchlistItemSchema = z.object({
  animeId: z.string(),
  title: z.string(),
  image: z.string(),
  releaseDate: z.string(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

const upsertSchema = createRoute({
  method: 'post',
  path: '/watchlist',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: watchlistBodySchema,
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
              item: watchlistItemSchema,
            }),
          }),
        },
      },
    },
  },
  description: 'Upsert authenticated user watchlist item.',
});

export default upsertSchema;
