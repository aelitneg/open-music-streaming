import { once } from 'node:events';
import { run } from './lib/process';
import { createRouter } from './routes';
import { startServer } from './lib/http';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

run(async (abortSignal) => {
  console.info('▶️ starting server...');

  // Setup HTTP router
  const router = createRouter();

  // Start HTTP server
  const { terminate } = await startServer(router, { port });
  console.info(`🎧 listening on port ${port}`);

  // Wait for abort signal
  if (!abortSignal.aborted) await once(abortSignal, 'abort');
  console.info('🛑 received abort signal, shutting down...');

  // Shutdown HTTP server
  await terminate();
  console.info('⏹️ server shutdown complete');
});
