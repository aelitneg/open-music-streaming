import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      COOKIE_SECRET:
        '0000000000000000000000000000000000000000000000000000000000000000',
    },
  },
});
