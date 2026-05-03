import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SINGLETON_ID = 'global';
const initialWatermark = new Date('2026-01-01T00:00:00Z');
const messageA = {
  id: 'm1',
  chatSessionId: 'c1',
  role: 'user' as const,
  parts: [{ type: 'text', text: 'how do I go back to old chats?' }],
  createdAt: new Date('2026-01-02T00:00:00Z'),
};

let stateRow = {
  id: SINGLETON_ID,
  lastExtractionAt: initialWatermark,
  updatedAt: initialWatermark,
};
const updateSet = vi.fn();
const dispatchAgentRun = vi.fn();
const extractFeatures = vi.fn();

vi.mock('@/db', () => ({
  getDb: () => ({
    select: () => ({
      from: (table: unknown) => {
        const isSystemState =
          typeof table === 'object' && table !== null && 'lastExtractionAt' in table;
        return {
          where: () => ({
            limit: async () => (isSystemState ? [stateRow] : [messageA]),
            orderBy: async () => (isSystemState ? [stateRow] : [messageA]),
          }),
        };
      },
    }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({ returning: async () => [stateRow] }),
      }),
    }),
    update: () => ({
      set: (patch: { lastExtractionAt: Date; updatedAt: Date }) => {
        updateSet(patch);
        stateRow = { ...stateRow, ...patch };
        return { where: async () => undefined };
      },
    }),
  }),
}));

vi.mock('@/lib/feature-extraction', async () => {
  const actual = await vi.importActual<typeof import('@/lib/feature-extraction')>(
    '@/lib/feature-extraction',
  );
  return { ...actual, extractFeatures };
});

vi.mock('@/lib/github-dispatch', () => ({ dispatchAgentRun }));

const feature = {
  title: 'Persisted chat sessions',
  description: 'Allow users to navigate back to prior chats from a sidebar.',
};

beforeEach(() => {
  process.env.CRON_SECRET = 'secret';
  stateRow = {
    id: SINGLETON_ID,
    lastExtractionAt: initialWatermark,
    updatedAt: initialWatermark,
  };
  updateSet.mockReset();
  dispatchAgentRun.mockReset();
  extractFeatures.mockReset();
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

function authedRequest(): Request {
  return new Request('http://localhost/api/cron/extract-and-dispatch', {
    headers: { authorization: 'Bearer secret' },
  });
}

describe('extract-and-dispatch watermark', () => {
  it('advances the watermark when every dispatch succeeds', async () => {
    extractFeatures.mockResolvedValue([feature]);
    dispatchAgentRun.mockResolvedValue(undefined);

    const { GET } = await import('./route');
    const res = await GET(authedRequest());
    const body = await res.json();

    expect(body.dispatched).toBe(1);
    expect(body.failed).toBe(0);
    expect(body.watermarkAdvanced).toBe(true);
    expect(updateSet).toHaveBeenCalledTimes(1);
    expect(updateSet.mock.calls[0][0].lastExtractionAt).toEqual(messageA.createdAt);
  });

  it('does not advance the watermark when any dispatch fails', async () => {
    extractFeatures.mockResolvedValue([feature]);
    dispatchAgentRun.mockRejectedValue(new Error('rate limited'));

    const { GET } = await import('./route');
    const res = await GET(authedRequest());
    const body = await res.json();

    expect(body.dispatched).toBe(0);
    expect(body.failed).toBe(1);
    expect(body.watermarkAdvanced).toBe(false);
    expect(body.watermark).toBe(initialWatermark.toISOString());
    expect(updateSet).not.toHaveBeenCalled();
  });
});
