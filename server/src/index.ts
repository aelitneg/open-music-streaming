import { once } from 'node:events';
import { run } from '@/lib/process';
import { createAppContext } from '@/context';
import { createRouter } from '@/routes';
import { startServer } from '@/lib/http';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

run(async (abortSignal) => {
  console.info('▶️ starting server...');

  // Create app context
  const appContext = await createAppContext();

  // Setup HTTP router
  const router = createRouter(appContext);

  // Start HTTP server
  const { terminate } = await startServer(router, { port });
  console.info(`🎧 listening on port ${port}`);

  // Wait for abort signal
  if (!abortSignal.aborted) await once(abortSignal, 'abort');
  console.info('🛑 received abort signal, shutting down...');

  // Shutdown HTTP server
  await terminate();

  // Destroy app context
  await appContext.destroy();

  console.info('⏹️ server shutdown complete');
});
