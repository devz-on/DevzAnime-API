import { createRoute, z } from '@hono/zod-openapi';

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  createdAt: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
});

const meSchema = createRoute({
  method: 'get',
  path: '/auth/me',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              user: userSchema,
            }),
          }),
        },
      },
    },
  },
  description: 'Get current authenticated user profile from session.',
});

export default meSchema;
