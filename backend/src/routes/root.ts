import type { FastifyInstance } from 'fastify';

export default async function rootRoute(app: FastifyInstance) {
  app.get(
    '/',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      return { status: 'ok' };
    },
  );
}
