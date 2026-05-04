import { describe, it, expect } from 'vitest';
import {
  detectOffTopicCategory,
  buildOffTopicResponse,
  SUPPORT_URL,
} from './off-topic';

describe('detectOffTopicCategory', () => {
  it('flags chat-history asks', () => {
    expect(detectOffTopicCategory('How do I see my chat history?')).toBe('chat-history');
    expect(detectOffTopicCategory('Can I export my conversations?')).toBe('chat-history');
    expect(detectOffTopicCategory('delete all my old chats')).toBe('chat-history');
  });

  it('flags UI-feature asks', () => {
    expect(detectOffTopicCategory('Is there a sidebar?')).toBe('ui-features');
    expect(detectOffTopicCategory('Can I switch to dark mode?')).toBe('ui-features');
    expect(detectOffTopicCategory('How do I change the theme?')).toBe('ui-features');
  });

  it('flags account/billing asks', () => {
    expect(detectOffTopicCategory('I need to reset my password')).toBe('account-billing');
    expect(detectOffTopicCategory('Cancel my subscription please')).toBe('account-billing');
    expect(detectOffTopicCategory('How do I delete my account?')).toBe('account-billing');
  });

  it('flags general app-support asks', () => {
    expect(detectOffTopicCategory('I want to report a bug')).toBe('general-app-support');
    expect(detectOffTopicCategory('The app is broken')).toBe('general-app-support');
  });

  it('returns null for trip-planning questions', () => {
    expect(detectOffTopicCategory('Plan a 3-day trip to Lisbon')).toBeNull();
    expect(detectOffTopicCategory('What should I eat in Tokyo?')).toBeNull();
    expect(detectOffTopicCategory('Best museums in Paris in October')).toBeNull();
  });

  it('returns null for empty or whitespace input', () => {
    expect(detectOffTopicCategory('')).toBeNull();
    expect(detectOffTopicCategory('   ')).toBeNull();
  });

  it('does not false-positive when an off-topic keyword is used in trip context', () => {
    // "history" alone is fine in a trip-planning context — only "chat history" is off-topic.
    expect(detectOffTopicCategory('I want to learn about the history of Rome on my trip')).toBeNull();
    // "dark" appears in many trip contexts; without "mode" it should not trip the UI rule.
    expect(detectOffTopicCategory('Where can I see dark skies on a trip to Iceland?')).toBeNull();
    // Trip context should override even if a UI keyword appears.
    expect(
      detectOffTopicCategory('Plan a trip to Tokyo with a stop at the Studio Ghibli museum'),
    ).toBeNull();
  });
});

describe('buildOffTopicResponse', () => {
  it('produces a message that explains scope and points to support', () => {
    const msg = buildOffTopicResponse('chat-history');
    expect(msg).toMatch(/trip-planning assistant/i);
    expect(msg).toContain(SUPPORT_URL);
  });

  it('returns a distinct response per category', () => {
    const a = buildOffTopicResponse('chat-history');
    const b = buildOffTopicResponse('ui-features');
    const c = buildOffTopicResponse('account-billing');
    const d = buildOffTopicResponse('general-app-support');
    const all = new Set([a, b, c, d]);
    expect(all.size).toBe(4);
    for (const m of all) {
      expect(m).toContain(SUPPORT_URL);
      expect(m).toMatch(/trip-planning assistant/i);
    }
  });
});
