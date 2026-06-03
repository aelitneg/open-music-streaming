import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../app.js';
import { TEST_DID, makeDbMock, setupDefaultAuth } from './helpers.js';

const TEST_ARTIST_RKEY = 'artistrkey123';
const TEST_ALBUM_RKEY = 'albumrkey123';
const TEST_ARTIST_URI = `at://${TEST_DID}/local.open-music-streaming.artist/${TEST_ARTIST_RKEY}`;
const TEST_ALBUM_URI = `at://${TEST_DID}/local.open-music-streaming.album/${TEST_ALBUM_RKEY}`;

const ARTIST_URL = `/artists/${TEST_ARTIST_RKEY}/albums`;
const ALBUM_URL = `/artists/${TEST_ARTIST_RKEY}/albums/${TEST_ALBUM_RKEY}`;

function makeArtistRow(overrides: Record<string, unknown> = {}) {
  return {
    uri: TEST_ARTIST_URI,
    did: TEST_DID,
    name: 'Test Artist',
    createdAt: '2024-01-01T00:00:00.000Z',
    indexedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeAlbumRow(overrides: Record<string, unknown> = {}) {
  return {
    uri: TEST_ALBUM_URI,
    did: TEST_DID,
    artistUri: TEST_ARTIST_URI,
    title: 'Test Album',
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

describe('GET /artists/:artistRkey/albums', () => {
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

    const response = await app.inject({ method: 'GET', url: ARTIST_URL });
    expect(response.statusCode).toBe(401);
  });

  it('returns the albums for the artist', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock({ selectResult: [makeAlbumRow()] });

    const response = await app.inject({ method: 'GET', url: ARTIST_URL });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      albums: [
        expect.objectContaining({ uri: TEST_ALBUM_URI, title: 'Test Album' }),
      ],
    });
  });

  it('returns an empty list when the artist has no albums', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock();

    const response = await app.inject({ method: 'GET', url: ARTIST_URL });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ albums: [] });
  });
});

describe('POST /artists/:artistRkey/albums', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultAuth(mockRequireAuth, mockPutRecord);
    mockPutRecord.mockResolvedValue({
      data: { uri: TEST_ALBUM_URI, cid: 'bafytest' },
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
      url: ARTIST_URL,
      payload: { title: 'My Album' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('returns 400 when title is missing', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock({ selectResult: [makeArtistRow()] });

    const response = await app.inject({
      method: 'POST',
      url: ARTIST_URL,
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'title is required' });
  });

  it('returns 400 when title is blank', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock({ selectResult: [makeArtistRow()] });

    const response = await app.inject({
      method: 'POST',
      url: ARTIST_URL,
      payload: { title: '   ' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'title is required' });
  });

  it('returns 404 when the artist does not exist', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock();

    const response = await app.inject({
      method: 'POST',
      url: ARTIST_URL,
      payload: { title: 'My Album' },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'artist not found' });
  });

  it('creates an album record and returns 201', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock({ selectResult: [makeArtistRow()] });

    const response = await app.inject({
      method: 'POST',
      url: ARTIST_URL,
      payload: { title: 'My Album' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      uri: TEST_ALBUM_URI,
      did: TEST_DID,
      artistUri: TEST_ARTIST_URI,
      title: 'My Album',
    });
    expect(mockPutRecord).toHaveBeenCalledOnce();
  });

  it('trims whitespace from the title', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock({ selectResult: [makeArtistRow()] });

    const response = await app.inject({
      method: 'POST',
      url: ARTIST_URL,
      payload: { title: '  My Album  ' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().title).toBe('My Album');
  });
});

describe('PATCH /artists/:artistRkey/albums/:albumRkey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultAuth(mockRequireAuth, mockPutRecord);
    mockPutRecord.mockResolvedValue({
      data: { uri: TEST_ALBUM_URI, cid: 'bafytest' },
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
      url: ALBUM_URL,
      payload: { title: 'Updated Title' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('returns 400 when title is missing', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock({ selectResult: [makeAlbumRow()] });

    const response = await app.inject({
      method: 'PATCH',
      url: ALBUM_URL,
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'title is required' });
  });

  it('returns 404 when the album does not exist', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock();

    const response = await app.inject({
      method: 'PATCH',
      url: ALBUM_URL,
      payload: { title: 'Updated Title' },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'album not found' });
  });

  it('updates the album title and returns the updated record', async () => {
    const app = buildApp();
    await app.ready();
    (app as any).db = makeDbMock({ selectResult: [makeAlbumRow()] });

    const response = await app.inject({
      method: 'PATCH',
      url: ALBUM_URL,
      payload: { title: 'Updated Title' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      uri: TEST_ALBUM_URI,
      title: 'Updated Title',
    });
    expect(mockPutRecord).toHaveBeenCalledOnce();
  });
});
