import { createRoute, z } from '@hono/zod-openapi';

const watchlistItemSchema = z.object({
  animeId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  image: z.string().trim().min(1),
  releaseDate: z.string().trim().min(1),
});

const importSchema = createRoute({
  method: 'post',
  path: '/watchlist/import',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(watchlistItemSchema).max(500),
          }),
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
              received: z.number(),
              processed: z.number(),
              upserted: z.number(),
              modified: z.number(),
              matched: z.number(),
              invalid: z.number(),
            }),
          }),
        },
      },
    },
  },
  description: 'Bulk import local watchlist into authenticated user account watchlist.',
});

export default importSchema;
