import { createRoute, z } from '@hono/zod-openapi';

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  createdAt: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
});

const loginBodySchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1).max(72),
});

const loginSchema = createRoute({
  method: 'post',
  path: '/auth/login',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: loginBodySchema,
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
              user: userSchema,
            }),
          }),
        },
      },
    },
  },
  description: 'Login by email or username and set auth session cookie.',
});

export default loginSchema;
