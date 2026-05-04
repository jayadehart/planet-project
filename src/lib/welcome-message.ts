import { generateId, type UIMessage } from 'ai';

export const WELCOME_MESSAGE_TEXT = `Hi! I'm a trip-planning assistant. Tell me where you want to go, when, and any constraints, and I'll draft a concrete plan you can act on — specific places to eat, things to do, and timing that fits your dates.

A few things I can't help with: live flight prices, current opening hours, or real-time availability. I also stick to trip planning, so I'm not the right tool for unrelated questions. For anything time-sensitive I'll point you to where to confirm.

Where are you thinking?`;

export function createWelcomeMessage(): UIMessage {
  return {
    id: generateId(),
    role: 'assistant',
    parts: [{ type: 'text', text: WELCOME_MESSAGE_TEXT, state: 'done' }],
  };
}
