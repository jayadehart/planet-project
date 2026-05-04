import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SINGLETON_ID = 'global';
const initialWatermark = new Date('2026-01-01T00:00:00Z');
const messageA = {
  id: 'm1',
  chatSessionId: 'c1',
  role: 'user' as const,
  parts: [{ type: 'text', text: 'plan me a 2-day trip to lisbon' }],
  createdAt: new Date('2026-01-02T00:00:00Z'),
};

let stateRow = {
  id: SINGLETON_ID,
  lastExtractionAt: initialWatermark,
  updatedAt: initialWatermark,
};
const updateSet = vi.fn();
const evalUpsert = vi.fn();
const dispatchAgentRun = vi.fn();
const extractFeatures = vi.fn();
const judgeSession = vi.fn();
const loadGoal = vi.fn();

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
    insert: (table: unknown) => ({
      values: (vals: unknown) => {
        const isEvaluations =
          typeof table === 'object' && table !== null && 'capabilityGap' in table;
        if (isEvaluations) evalUpsert(vals);
        return {
          onConflictDoNothing: () => ({ returning: async () => [stateRow] }),
          onConflictDoUpdate: async () => undefined,
        };
      },
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

vi.mock('@/lib/session-evaluation', () => ({ judgeSession, loadGoal }));

const feature = {
  title: 'Show real-time flight prices',
  description: 'Address the recurring "no flight prices" capability gap by integrating a flight price lookup tool.',
};

const lowScoreEvaluation = {
  goalMet: 2,
  capabilityGap: 'no flight prices',
  friction: null,
  notes: 'User asked for flight options; assistant could not provide real-time prices.',
};

const highScoreEvaluation = {
  goalMet: 5,
  capabilityGap: null,
  friction: null,
  notes: 'Solid plan delivered.',
};

beforeEach(() => {
  process.env.CRON_SECRET = 'secret';
  stateRow = {
    id: SINGLETON_ID,
    lastExtractionAt: initialWatermark,
    updatedAt: initialWatermark,
  };
  updateSet.mockReset();
  evalUpsert.mockReset();
  dispatchAgentRun.mockReset();
  extractFeatures.mockReset();
  judgeSession.mockReset();
  loadGoal.mockReset();
  loadGoal.mockResolvedValue('Help users build a concrete trip plan.');
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

function authedRequest(): Request {
  return new Request('http://localhost/api/cron/extract-and-dispatch', {
    headers: { authorization: 'Bearer secret' },
  });
}

describe('extract-and-dispatch pipeline', () => {
  it('judges sessions, dispatches features for low-scoring ones, and advances the watermark', async () => {
    judgeSession.mockResolvedValue(lowScoreEvaluation);
    extractFeatures.mockResolvedValue([feature]);
    dispatchAgentRun.mockResolvedValue(undefined);

    const { GET } = await import('./route');
    const res = await GET(authedRequest());
    const body = await res.json();

    expect(judgeSession).toHaveBeenCalledTimes(1);
    expect(evalUpsert).toHaveBeenCalledTimes(1);
    expect(evalUpsert.mock.calls[0][0].goalMet).toBe(2);
    expect(extractFeatures).toHaveBeenCalledTimes(1);
    expect(extractFeatures.mock.calls[0][0]).toHaveLength(1);
    expect(body.sessionsJudged).toBe(1);
    expect(body.lowScoringSessions).toBe(1);
    expect(body.dispatched).toBe(1);
    expect(body.watermarkAdvanced).toBe(true);
    expect(updateSet).toHaveBeenCalledTimes(1);
    expect(updateSet.mock.calls[0][0].lastExtractionAt).toEqual(messageA.createdAt);
  });

  it('skips extraction when every session scores above the threshold', async () => {
    judgeSession.mockResolvedValue(highScoreEvaluation);
    extractFeatures.mockResolvedValue([]);
    dispatchAgentRun.mockResolvedValue(undefined);

    const { GET } = await import('./route');
    const res = await GET(authedRequest());
    const body = await res.json();

    expect(judgeSession).toHaveBeenCalledTimes(1);
    expect(extractFeatures).toHaveBeenCalledTimes(1);
    expect(extractFeatures.mock.calls[0][0]).toHaveLength(0);
    expect(body.lowScoringSessions).toBe(0);
    expect(body.dispatched).toBe(0);
    expect(body.watermarkAdvanced).toBe(true);
  });

  it('does not advance the watermark when any dispatch fails', async () => {
    judgeSession.mockResolvedValue(lowScoreEvaluation);
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
