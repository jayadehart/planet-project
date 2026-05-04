import { describe, it, expect } from 'vitest';
import { isFirstUserMessage, isAmbiguousMessage } from './message-classifier';
import type { UIMessage } from 'ai';

describe('isFirstUserMessage', () => {
  it('returns true when there is exactly one user message', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      },
    ];
    expect(isFirstUserMessage(messages)).toBe(true);
  });

  it('returns false when there are no user messages', () => {
    const messages: UIMessage[] = [];
    expect(isFirstUserMessage(messages)).toBe(false);
  });

  it('returns false when there are multiple user messages', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'First message' }],
      },
      {
        id: '2',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Response' }],
      },
      {
        id: '3',
        role: 'user',
        parts: [{ type: 'text', text: 'Second message' }],
      },
    ];
    expect(isFirstUserMessage(messages)).toBe(false);
  });

  it('returns true when there is one user message and other assistant messages', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      },
      {
        id: '2',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hi there!' }],
      },
    ];
    expect(isFirstUserMessage(messages)).toBe(true);
  });
});

describe('isAmbiguousMessage', () => {
  describe('detects ambiguous casual greetings', () => {
    it('identifies "whats up dog" as ambiguous', () => {
      expect(isAmbiguousMessage('whats up dog')).toBe(true);
    });

    it('identifies "hey" as ambiguous', () => {
      expect(isAmbiguousMessage('hey')).toBe(true);
    });

    it('identifies "hi" as ambiguous', () => {
      expect(isAmbiguousMessage('hi')).toBe(true);
    });

    it('identifies "hello" as ambiguous', () => {
      expect(isAmbiguousMessage('hello')).toBe(true);
    });

    it('identifies "yo" as ambiguous', () => {
      expect(isAmbiguousMessage('yo')).toBe(true);
    });

    it('identifies "sup" as ambiguous', () => {
      expect(isAmbiguousMessage('sup')).toBe(true);
    });

    it('identifies "how are you" as ambiguous', () => {
      expect(isAmbiguousMessage('how are you')).toBe(true);
    });

    it('identifies greetings with casual slang as ambiguous', () => {
      expect(isAmbiguousMessage('hey dude')).toBe(true);
      expect(isAmbiguousMessage('whats up bro')).toBe(true);
      expect(isAmbiguousMessage('yo man')).toBe(true);
    });
  });

  describe('recognizes clear trip-planning messages', () => {
    it('does not flag "I want to plan a trip to Paris"', () => {
      expect(isAmbiguousMessage('I want to plan a trip to Paris')).toBe(false);
    });

    it('does not flag "help me plan my vacation"', () => {
      expect(isAmbiguousMessage('help me plan my vacation')).toBe(false);
    });

    it('does not flag "I am going to visit Japan next month"', () => {
      expect(isAmbiguousMessage('I am going to visit Japan next month')).toBe(false);
    });

    it('does not flag "what are good restaurants in Rome"', () => {
      expect(isAmbiguousMessage('what are good restaurants in Rome')).toBe(false);
    });

    it('does not flag "I need help with my travel itinerary"', () => {
      expect(isAmbiguousMessage('I need help with my travel itinerary')).toBe(false);
    });

    it('does not flag "looking for activities in Barcelona"', () => {
      expect(isAmbiguousMessage('looking for activities in Barcelona')).toBe(false);
    });

    it('does not flag "what sights should I see"', () => {
      expect(isAmbiguousMessage('what sights should I see')).toBe(false);
    });
  });

  describe('handles edge cases', () => {
    it('handles empty strings', () => {
      expect(isAmbiguousMessage('')).toBe(false);
    });

    it('handles whitespace-only strings', () => {
      expect(isAmbiguousMessage('   ')).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(isAmbiguousMessage('HEY')).toBe(true);
      expect(isAmbiguousMessage('WhAtS uP dOg')).toBe(true);
    });

    it('does not flag greetings with trip context', () => {
      expect(isAmbiguousMessage('hey I want to plan a trip')).toBe(false);
      expect(isAmbiguousMessage('hello, can you help me with my vacation')).toBe(false);
    });

    it('does not flag "Manhattan" even though it contains "man"', () => {
      expect(isAmbiguousMessage('I want to visit Manhattan')).toBe(false);
    });
  });
});
