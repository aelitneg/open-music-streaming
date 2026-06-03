import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../app.js';
import {
  TEST_DID,
  TEST_HANDLE,
  makeDbMock,
  setupDefaultAuth,
} from './helpers.js';

const TEST_RKEY = 'abc123tid';
const TEST_URI = `at://${TEST_DID}/local.open-music-streaming.artist/${TEST_RKEY}`;

function makeArtistRow(overrides: Record<string, unknown> = {}) {
  return {
    uri: TEST_URI,
    did: TEST_DID,
    name: 'Test Artist',
    createdAt: '2024-01-01T00:00:00.000Z',
    indexedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

const { mockPutRecord, mockRequireAuth } = vi.hoisted(() => {
  return { mockPutRecord: vi.fn(), mockRequireAuth: vi.fn() };
});

vi.mock('../plugins/session.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../plugins/session.js')>();
  return { ...actual, requireAuth: mockRequireAuth };
});

describe('GET /artists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultAuth(mockRequireAuth, mockPutRecord);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockImplementationOnce(async (_req: any, reply: any) => {
      await reply.status(401).send({ error: 'not authenticated' });
    });

    const app = buildApp();
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/artists' });
    expect(response.statusCode).toBe(401);
  });

  it('returns the authenticated users artist profiles', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock({ selectResult: [makeArtistRow()] });

    const response = await app.inject({ method: 'GET', url: '/artists' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      artists: [
        expect.objectContaining({ uri: TEST_URI, name: 'Test Artist' }),
      ],
    });
  });

  it('returns an empty list when the user has no artists', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock();

    const response = await app.inject({ method: 'GET', url: '/artists' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ artists: [] });
  });
});

describe('POST /artists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultAuth(mockRequireAuth, mockPutRecord);
    mockPutRecord.mockResolvedValue({
      data: { uri: TEST_URI, cid: 'bafytest' },
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockImplementationOnce(async (_req: any, reply: any) => {
      await reply.status(401).send({ error: 'not authenticated' });
    });

    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/artists',
      payload: { name: 'My Artist' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('returns 400 when name is missing', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock();

    const response = await app.inject({
      method: 'POST',
      url: '/artists',
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'name is required' });
  });

  it('returns 400 when name is blank', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock();

    const response = await app.inject({
      method: 'POST',
      url: '/artists',
      payload: { name: '   ' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'name is required' });
  });

  it('creates an artist record and returns 201', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock();

    const response = await app.inject({
      method: 'POST',
      url: '/artists',
      payload: { name: 'My Artist' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      uri: TEST_URI,
      did: TEST_DID,
      name: 'My Artist',
    });
    expect(mockPutRecord).toHaveBeenCalledOnce();
  });

  it('trims whitespace from the name', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock();

    const response = await app.inject({
      method: 'POST',
      url: '/artists',
      payload: { name: '  My Artist  ' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().name).toBe('My Artist');
  });
});

describe('PATCH /artists/:rkey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultAuth(mockRequireAuth, mockPutRecord);
    mockPutRecord.mockResolvedValue({
      data: { uri: TEST_URI, cid: 'bafytest' },
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockImplementationOnce(async (_req: any, reply: any) => {
      await reply.status(401).send({ error: 'not authenticated' });
    });

    const app = buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/artists/${TEST_RKEY}`,
      payload: { name: 'Updated Name' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('returns 400 when name is missing', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock({ selectResult: [makeArtistRow()] });

    const response = await app.inject({
      method: 'PATCH',
      url: `/artists/${TEST_RKEY}`,
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'name is required' });
  });

  it('returns 404 when the artist does not exist', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock();

    const response = await app.inject({
      method: 'PATCH',
      url: `/artists/${TEST_RKEY}`,
      payload: { name: 'Updated Name' },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'artist not found' });
  });

  it('updates the artist name and returns the updated record', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock({ selectResult: [makeArtistRow()] });

    const response = await app.inject({
      method: 'PATCH',
      url: `/artists/${TEST_RKEY}`,
      payload: { name: 'Updated Name' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      uri: TEST_URI,
      name: 'Updated Name',
    });
    expect(mockPutRecord).toHaveBeenCalledOnce();
  });
});
