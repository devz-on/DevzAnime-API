import { createRoute, z } from '@hono/zod-openapi';

const logoutSchema = createRoute({
  method: 'post',
  path: '/auth/logout',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              ok: z.boolean(),
            }),
          }),
        },
      },
    },
  },
  description: 'Clear current auth session cookie.',
});

export default logoutSchema;
