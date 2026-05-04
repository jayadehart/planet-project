export type OffTopicCategory =
  | 'chat-history'
  | 'ui-features'
  | 'account-billing'
  | 'general-app-support';

export const SUPPORT_URL = 'https://github.com/anthropics/planet-project/issues';

const TRIP_CONTEXT_PATTERNS: ReadonlyArray<RegExp> = [
  /\btrips?\b/i,
  /\btravel(l?ing|l?ed)?\b/i,
  /\bvacation\b/i,
  /\bholiday\b/i,
  /\bitinerary\b/i,
  /\bdestinations?\b/i,
  /\bflights?\b/i,
  /\bhotels?\b/i,
  /\bairbnbs?\b/i,
  /\bhostels?\b/i,
  /\brestaurants?\b/i,
  /\bmuseums?\b/i,
  /\btours?\b/i,
  /\bvisit(ing|ed)?\b/i,
  /\bgoing\s+to\s+[A-Z]/,
];

const CATEGORY_PATTERNS: ReadonlyArray<{
  category: OffTopicCategory;
  patterns: ReadonlyArray<RegExp>;
}> = [
  {
    category: 'chat-history',
    patterns: [
      /\b(chat|conversation|message)\s+history\b/i,
      /\b(delete|clear|export|search|find|view|see|access|recover|restore)\s+((?:my|all|previous|old|past)\s+)*(chats?|conversations?|messages?)\b/i,
      /\bhistory\s+of\s+(my|our)\s+(chats?|conversations?)\b/i,
      /\bsaved?\s+(chats?|conversations?)\b/i,
      /\bwhere\s+(are|do\s+i\s+find)\s+my\s+(chats?|conversations?)\b/i,
    ],
  },
  {
    category: 'ui-features',
    patterns: [
      /\bsidebar\b/i,
      /\b(dark|light)\s+mode\b/i,
      /\b(open|close|hide|show|toggle|expand|collapse)\s+(the\s+)?(sidebar|menu|panel|pane|drawer|nav)\b/i,
      /\b(change|customi[sz]e|set|update|switch)\s+(the\s+)?(theme|font|colou?r|background)\b/i,
      /\bkeyboard\s+shortcut/i,
      /\b(resize|move)\s+(the\s+)?(window|panel|sidebar)\b/i,
    ],
  },
  {
    category: 'account-billing',
    patterns: [
      /\b(reset|change|update|forgot)\s+(my\s+)?password\b/i,
      /\b(delete|deactivate|close)\s+(my\s+)?account\b/i,
      /\b(cancel|upgrade|downgrade|change)\s+(my\s+)?(subscription|plan|billing)\b/i,
      /\b(refund|invoice|payment\s+method|credit\s+card|charged?)\b/i,
      /\blog\s*(in|out|off)\b/i,
      /\bsign\s*(in|out|up)\b/i,
      /\b2fa\b|\btwo[-\s]?factor\b/i,
    ],
  },
  {
    category: 'general-app-support',
    patterns: [
      /\b(report|file)\s+(a\s+)?(bug|issue)\b/i,
      /\b(this|the)\s+app\s+(is\s+)?(broken|not\s+working|crashing|down)\b/i,
      /\bcontact\s+(support|customer\s+service)\b/i,
      /\bhow\s+do\s+i\s+(use|navigate)\s+(this|the)\s+app\b/i,
    ],
  },
];

export function detectOffTopicCategory(text: string): OffTopicCategory | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;

  if (TRIP_CONTEXT_PATTERNS.some((p) => p.test(trimmed))) return null;

  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some((p) => p.test(trimmed))) return category;
  }
  return null;
}

const PURPOSE_LINE =
  "I'm a trip-planning assistant — I can suggest destinations, build day-by-day itineraries, check the weather for your travel dates, or work out budget and travel-time math.";

const RESPONSES: Record<OffTopicCategory, string> = {
  'chat-history': `I can't help manage chat history — saving, exporting, deleting, or searching past conversations is an app-level feature outside my scope. ${PURPOSE_LINE}\n\nFor help with chat history, please file an issue at ${SUPPORT_URL}.`,
  'ui-features': `I can't change the app's UI or settings — things like the sidebar, theme, or keyboard shortcuts are outside what I can do. ${PURPOSE_LINE}\n\nFor UI or settings questions, please file an issue at ${SUPPORT_URL}.`,
  'account-billing': `I can't help with account, login, or billing questions — those are handled outside this chat. ${PURPOSE_LINE}\n\nFor anything related to your account, password, or payments, please file an issue at ${SUPPORT_URL}.`,
  'general-app-support': `It looks like you're asking about the app itself, which is outside what I can help with. ${PURPOSE_LINE}\n\nFor app issues or general support, please file an issue at ${SUPPORT_URL}.`,
};

export function buildOffTopicResponse(category: OffTopicCategory): string {
  return RESPONSES[category];
}
