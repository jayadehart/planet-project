import type { UIMessage } from 'ai';

export function isFirstUserMessage(messages: UIMessage[]): boolean {
  const userMessages = messages.filter((m) => m.role === 'user');
  return userMessages.length === 1;
}

export function isAmbiguousMessage(content: string): boolean {
  const lowercased = content.toLowerCase().trim();
  const ambiguousPatterns = [
    /^(hey|hi|hello|yo|sup|whats up|what's up|whatsup|wassup)(\s|$)/i,
    /^(how are you|how's it going|how is it going)(\s|$)/i,
    /dog|dude|bro|man(?!\s*\w)/i,
  ];

  const hasNoTripKeywords = !/trip|travel|vacation|visit|destination|plan|going to|flight|hotel|restaurant|activities|sights?|tour|itinerary/i.test(content);
  const isVeryShort = content.split(/\s+/).length < 4;
  const matchesPattern = ambiguousPatterns.some((pattern) => pattern.test(lowercased));

  return (matchesPattern && hasNoTripKeywords) || (isVeryShort && hasNoTripKeywords && /^(hi|hey|hello|yo|sup)$/i.test(lowercased));
}
