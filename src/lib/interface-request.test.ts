import { describe, it, expect } from 'vitest';
import type { ModelMessage } from 'ai';
import {
  detectInterfaceRequest,
  isFirstMessageInterfaceRequest,
  INTERFACE_REDIRECT_INSTRUCTION,
} from './interface-request';

describe('detectInterfaceRequest', () => {
  it('detects common interface keywords', () => {
    const examples = [
      'Can you add a sidebar with my chats?',
      'where is the chat history',
      'How do I open the settings page?',
      'Please switch to dark mode',
      'I want to sign up for an account',
      "what's that send button do",
      'show me past chats',
    ];
    for (const text of examples) {
      expect(detectInterfaceRequest(text), text).toBe(true);
    }
  });

  it('does not flag trip-planning questions', () => {
    const examples = [
      'I want to go to Lisbon for three days in late May, what should I do?',
      'Plan a weekend in Tokyo focused on ramen and bookstores.',
      'It gets dark early in Reykjavik in winter, what tours run after sunset?',
      'We have settled on Kyoto — what neighborhoods should we stay in?',
      'My partner wants somewhere with good light for photography in October.',
    ];
    for (const text of examples) {
      expect(detectInterfaceRequest(text), text).toBe(false);
    }
  });

  it('returns false for empty input', () => {
    expect(detectInterfaceRequest('')).toBe(false);
  });

  it('matches case-insensitively and ignores punctuation', () => {
    expect(detectInterfaceRequest('Where is the SIDEBAR?')).toBe(true);
    expect(detectInterfaceRequest('Toggle: dark-mode, please')).toBe(true);
  });
});

describe('isFirstMessageInterfaceRequest', () => {
  const userMessage = (text: string): ModelMessage => ({
    role: 'user',
    content: text,
  });

  it('fires only on a single first user message', () => {
    expect(isFirstMessageInterfaceRequest([userMessage('Where is the sidebar?')])).toBe(true);
  });

  it('handles part-array content', () => {
    const m: ModelMessage = {
      role: 'user',
      content: [{ type: 'text', text: 'I want dark mode please' }],
    };
    expect(isFirstMessageInterfaceRequest([m])).toBe(true);
  });

  it('does not fire after the first turn', () => {
    expect(
      isFirstMessageInterfaceRequest([
        userMessage('Plan me a trip to Rome'),
        { role: 'assistant', content: 'Sure! How many days?' },
        userMessage('Where is the sidebar?'),
      ]),
    ).toBe(false);
  });

  it('does not fire on a non-interface first message', () => {
    expect(
      isFirstMessageInterfaceRequest([userMessage('Three days in Lisbon, what should I do?')]),
    ).toBe(false);
  });

  it('does not fire when the only message is from the assistant', () => {
    expect(
      isFirstMessageInterfaceRequest([
        { role: 'assistant', content: 'How can I help?' },
      ]),
    ).toBe(false);
  });
});

describe('INTERFACE_REDIRECT_INSTRUCTION', () => {
  it('is non-empty guidance', () => {
    expect(INTERFACE_REDIRECT_INSTRUCTION.length).toBeGreaterThan(50);
  });
});
