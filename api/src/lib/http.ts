import { once } from 'node:events';
import { createServer, RequestListener } from 'node:http';
import { NextFunction, Request, Response } from 'express';
import { createHttpTerminator } from 'http-terminator';

/**
 * Route Handler - wrapper for route handlers that ensures errors are handled by the
 * proper middleware.
 */
export function handler(
  fn: (req: Request, res: Response) => unknown | Promise<unknown>,
): (req: Request, res: Response, next: NextFunction) => void {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (err) {
      next(err);
    }
  };
}

/**
 * HTTP Server - starts an HTTP server listening. Uses http-terminator to gracefully
 * shutdown the server when the process is terminated.
 */
export async function startServer(
  listener: RequestListener,
  { port }: { port?: number } = {},
) {
  const server = createServer(listener);

  // Disable keep-alive to ensure connections close immediately
  server.keepAliveTimeout = 0;

  const { terminate } = createHttpTerminator({
    server,
  });

  server.listen(port);
  await once(server, 'listening');

  return { server, terminate };
}
