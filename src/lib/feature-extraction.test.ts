import { describe, it, expect } from 'vitest';
import { featureSchema, featureListSchema } from './feature-extraction';

describe('featureSchema', () => {
  it('accepts a well-formed feature', () => {
    const parsed = featureSchema.parse({
      title: 'Add timestamps to chat list',
      description: 'Show the relative time of the last message next to each chat in the sidebar.',
    });
    expect(parsed.title).toBe('Add timestamps to chat list');
  });

  it('rejects a title that is too short', () => {
    expect(() => featureSchema.parse({ title: 'no', description: 'x'.repeat(30) })).toThrow();
  });

  it('rejects a description that is too short', () => {
    expect(() => featureSchema.parse({ title: 'A reasonable title', description: 'too short' })).toThrow();
  });
});

describe('featureListSchema', () => {
  it('accepts an empty feature list', () => {
    expect(featureListSchema.parse({ features: [] }).features).toEqual([]);
  });

  it('accepts multiple features', () => {
    const parsed = featureListSchema.parse({
      features: [
        { title: 'First feature title', description: 'A description that is long enough to pass.' },
        { title: 'Second feature title', description: 'Another description that is sufficiently long.' },
      ],
    });
    expect(parsed.features).toHaveLength(2);
  });
});
