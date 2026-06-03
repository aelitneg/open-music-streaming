import { vi } from 'vitest';

export const TEST_DID = 'did:plc:test123';
export const TEST_HANDLE = 'test.bsky.social';

// Builds a chainable DB mock. .where() returns a thenable that also has .limit(),
// so it works whether the caller awaits .where() directly or chains .limit(1) first.
export function makeDbMock({ selectResult = [] as unknown[] } = {}) {
  const whereResult = Object.assign(Promise.resolve(selectResult), {
    limit: vi.fn().mockResolvedValue(selectResult),
  });
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({ where: vi.fn(() => whereResult) })),
    })),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
    })),
  };
}

export function setupDefaultAuth(
  mockRequireAuth: ReturnType<typeof vi.fn>,
  mockPutRecord: ReturnType<typeof vi.fn>,
) {
  mockRequireAuth.mockImplementation(async (request: any) => {
    request.session = { did: TEST_DID, handle: TEST_HANDLE };
    request.agent = {
      com: { atproto: { repo: { putRecord: mockPutRecord } } },
    };
  });
}
