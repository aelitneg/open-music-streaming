import { describe, it, expect } from 'vitest';
import { buildApp } from '../app.js';

describe('GET /', () => {
  it('returns 200 with status ok', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
