import { describe, it, expect } from 'vitest';
import { WELCOME_MESSAGE_TEXT, createWelcomeMessage } from './welcome-message';

describe('createWelcomeMessage', () => {
  it('returns an assistant message containing the welcome text', () => {
    const msg = createWelcomeMessage();
    expect(msg.role).toBe('assistant');
    expect(msg.id).toBeTruthy();
    expect(msg.parts).toHaveLength(1);
    expect(msg.parts[0]).toMatchObject({
      type: 'text',
      text: WELCOME_MESSAGE_TEXT,
      state: 'done',
    });
  });

  it('generates a unique id on each call so multiple chats do not collide', () => {
    const a = createWelcomeMessage();
    const b = createWelcomeMessage();
    expect(a.id).not.toBe(b.id);
  });
});

describe('WELCOME_MESSAGE_TEXT', () => {
  it('describes the trip-planning purpose so users know what the assistant is for', () => {
    expect(WELCOME_MESSAGE_TEXT.toLowerCase()).toContain('trip');
  });

  it('flags unsupported capabilities so users do not waste time asking for them', () => {
    expect(WELCOME_MESSAGE_TEXT.toLowerCase()).toMatch(/can't|cannot|don't|not the right/);
  });
});
