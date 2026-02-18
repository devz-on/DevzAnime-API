import { createRoute, z } from '@hono/zod-openapi';

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  createdAt: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
});

const registerBodySchema = z.object({
  email: z.string().trim().email(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(72),
});

const registerSchema = createRoute({
  method: 'post',
  path: '/auth/register',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: registerBodySchema,
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
  description: 'Register a new user account and set auth session cookie.',
});

export default registerSchema;
