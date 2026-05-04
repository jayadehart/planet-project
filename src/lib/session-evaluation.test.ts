import { describe, it, expect } from 'vitest';
import { evaluationSchema } from './session-evaluation';

describe('evaluationSchema', () => {
  it('accepts a well-formed evaluation', () => {
    const parsed = evaluationSchema.parse({
      goalMet: 4,
      capabilityGap: null,
      friction: 'asked dates twice',
      notes: 'Produced a specific 2-day plan but re-asked the dates partway through.',
    });
    expect(parsed.goalMet).toBe(4);
    expect(parsed.friction).toBe('asked dates twice');
  });

  it('rejects scores outside 1-5', () => {
    expect(() =>
      evaluationSchema.parse({
        goalMet: 6,
        capabilityGap: null,
        friction: null,
        notes: 'x',
      }),
    ).toThrow();
  });

  it('rejects non-integer scores', () => {
    expect(() =>
      evaluationSchema.parse({
        goalMet: 3.5,
        capabilityGap: null,
        friction: null,
        notes: 'x',
      }),
    ).toThrow();
  });
});
