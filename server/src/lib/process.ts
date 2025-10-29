const SIGNALS = ['SIGINT', 'SIGTERM'] as const;

/**
 * Process Management - runs a function with  an abort signal which is triggered w
 * hen the process is terminated.
 */
export async function run<F extends (signal: AbortSignal) => Promise<void>>(
  fn: F,
): Promise<void> {
  const abortController = new AbortController();

  /**
   * Listener function for process signals.
   */
  const abort = (signal?: string) => {
    // Remove all signal event listeners
    for (const sig of SIGNALS) {
      process.off(sig, abort);
    }

    abortController.abort(signal);
  };

  for (const sig of SIGNALS) {
    process.on(sig, abort);
  }

  try {
    await fn(abortController.signal);
  } finally {
    abort();
  }
}
