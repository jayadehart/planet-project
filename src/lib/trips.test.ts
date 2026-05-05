import { describe, it, expect } from 'vitest';
import {
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
