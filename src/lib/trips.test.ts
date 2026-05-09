import { describe, it, expect } from 'vitest';
import {
  deriveTripTitle,
  filterTripsByQuery,
  formatTripBudget,
  formatTripDateRange,
  tripCreateSchema,
  tripUpdateSchema,
} from './trips';

describe('tripUpdateSchema', () => {
  it('accepts a partial patch with valid fields', () => {
    const parsed = tripUpdateSchema.parse({
      title: 'Tokyo cherry blossoms',
      isFavorite: true,
    });
    expect(parsed.title).toBe('Tokyo cherry blossoms');
    expect(parsed.isFavorite).toBe(true);
  });

  it('allows nulling out optional fields explicitly', () => {
    const parsed = tripUpdateSchema.parse({
      destination: null,
      startDate: null,
      budgetCents: null,
    });
    expect(parsed.destination).toBeNull();
    expect(parsed.budgetCents).toBeNull();
  });

  it('rejects an empty patch', () => {
    expect(() => tripUpdateSchema.parse({})).toThrow();
  });

  it('rejects a blank title', () => {
    expect(() => tripUpdateSchema.parse({ title: '   ' })).toThrow();
  });

  it('rejects a budget that is negative', () => {
    expect(() => tripUpdateSchema.parse({ budgetCents: -100 })).toThrow();
  });

  it('rejects an unknown status', () => {
    expect(() =>
      tripUpdateSchema.parse({ status: 'cancelled' as never }),
    ).toThrow();
  });
});

describe('tripCreateSchema', () => {
  it('accepts an empty body (defaults applied later)', () => {
    expect(tripCreateSchema.parse({})).toEqual({});
  });

  it('rejects a title longer than the cap', () => {
    expect(() =>
      tripCreateSchema.parse({ title: 'x'.repeat(200) }),
    ).toThrow();
  });
});

describe('formatTripDateRange', () => {
  it('shows TBD when both dates are missing', () => {
    expect(formatTripDateRange(null, null)).toBe('Dates TBD');
  });

  it('shows a range when both dates are present', () => {
    expect(formatTripDateRange('2026-06-01', '2026-06-08')).toBe(
      '2026-06-01 → 2026-06-08',
    );
  });

  it('shows only the available endpoint when one is missing', () => {
    expect(formatTripDateRange('2026-06-01', null)).toBe('2026-06-01');
    expect(formatTripDateRange(null, '2026-06-08')).toBe('2026-06-08');
  });
});

describe('formatTripBudget', () => {
  it('returns null when budget is null', () => {
    expect(formatTripBudget(null)).toBeNull();
  });

  it('formats cents as USD dollars with thousands separators', () => {
    expect(formatTripBudget(250000)).toBe('$2,500');
    expect(formatTripBudget(0)).toBe('$0');
  });
});

describe('deriveTripTitle', () => {
  it('returns the custom title when one has been set', () => {
    expect(
      deriveTripTitle({
        title: 'Cherry blossom run',
        destination: 'Tokyo',
        startDate: null,
        endDate: null,
      }),
    ).toBe('Cherry blossom run');
  });

  it('falls back to destination + dates when title is the default placeholder', () => {
    expect(
      deriveTripTitle({
        title: 'Untitled trip',
        destination: 'Lisbon, Portugal',
        startDate: '2026-06-12',
        endDate: '2026-06-15',
      }),
    ).toBe('Lisbon, Portugal (2026-06-12 → 2026-06-15)');
  });

  it('falls back to just the destination when no dates are set', () => {
    expect(
      deriveTripTitle({
        title: 'Untitled trip',
        destination: 'Lisbon, Portugal',
        startDate: null,
        endDate: null,
      }),
    ).toBe('Lisbon, Portugal');
  });

  it('keeps the default title when neither destination nor custom title exist', () => {
    expect(
      deriveTripTitle({
        title: 'Untitled trip',
        destination: null,
        startDate: null,
        endDate: null,
      }),
    ).toBe('Untitled trip');
  });
});

describe('filterTripsByQuery', () => {
  const trips = [
    {
      id: 't1',
      title: 'Lisbon long weekend',
      destination: 'Lisbon, Portugal',
      status: 'planning',
    },
    {
      id: 't2',
      title: 'Kyoto autumn',
      destination: 'Kyoto, Japan',
      status: 'booked',
    },
    {
      id: 't3',
      title: 'Family ski trip',
      destination: null,
      status: 'planning',
    },
  ];

  it('returns the full list when the query is empty or whitespace', () => {
    expect(filterTripsByQuery(trips, '')).toEqual(trips);
    expect(filterTripsByQuery(trips, '   ')).toEqual(trips);
  });

  it('matches case-insensitively against title, destination, and status', () => {
    expect(filterTripsByQuery(trips, 'lisbon').map((t) => t.id)).toEqual(['t1']);
    expect(filterTripsByQuery(trips, 'JAPAN').map((t) => t.id)).toEqual(['t2']);
    expect(filterTripsByQuery(trips, 'booked').map((t) => t.id)).toEqual(['t2']);
    expect(filterTripsByQuery(trips, 'ski').map((t) => t.id)).toEqual(['t3']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterTripsByQuery(trips, 'antarctica')).toEqual([]);
  });

  it('handles trips with a null destination without throwing', () => {
    expect(filterTripsByQuery(trips, 'family').map((t) => t.id)).toEqual(['t3']);
  });
});
