import { describe, it, expect, vi, afterEach } from 'vitest';
import { weather } from './weather';
import type { ToolExecutionOptions } from 'ai';

const mockOptions: ToolExecutionOptions = {
  toolCallId: 'test-call-id',
  messages: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('weather tool', () => {
  it('returns the wttr.in payload for a city', async () => {
    const payload = {
      current_condition: [{ temp_C: '18', weatherDesc: [{ value: 'Partly cloudy' }] }],
      weather: [{ date: '2026-05-10', maxtempC: '22', mintempC: '14' }],
    };
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify(payload), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await weather.execute?.({ location: 'Lisbon' }, mockOptions);

    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith('https://wttr.in/Lisbon?format=j1');
  });

  it('throws when wttr.in returns a non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 503 })),
    );

    await expect(
      weather.execute?.({ location: 'Atlantis' }, mockOptions),
    ).rejects.toThrow(/wttr\.in failed: 503/);
  });

  it('url-encodes locations with spaces and commas', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({}), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await weather.execute?.({ location: 'Kyoto, Japan' }, mockOptions);

    expect(fetchMock).toHaveBeenCalledWith('https://wttr.in/Kyoto%2C%20Japan?format=j1');
  });
});
