import type { ModelMessage } from 'ai';

const INTERFACE_KEYWORDS: readonly string[] = [
  'sidebar',
  'side bar',
  'chat history',
  'previous chats',
  'past chats',
  'conversation list',
  'conversation history',
  'rename chat',
  'rename this chat',
  'delete chat',
  'delete this chat',
  'export chat',
  'export this chat',
  'share chat',
  'share this chat',
  'dark mode',
  'light mode',
  'dark theme',
  'light theme',
  'color theme',
  'color scheme',
  'navbar',
  'nav bar',
  'navigation bar',
  'settings page',
  'settings menu',
  'settings panel',
  'preferences page',
  'preferences menu',
  'send button',
  'submit button',
  'share button',
  'sign in',
  'sign up',
  'sign out',
  'log in',
  'log out',
  'logout',
  'create account',
  'user profile',
  'profile page',
  'profile picture',
  'change the ui',
  'change the interface',
  'change the layout',
  'change the design',
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const KEYWORD_PATTERN = new RegExp(
  `(?:^|[^a-z0-9])(?:${INTERFACE_KEYWORDS.map((kw) =>
    kw.split(' ').map(escapeRegex).join('[^a-z0-9]+'),
  ).join('|')})(?:$|[^a-z0-9])`,
  'i',
);

export function detectInterfaceRequest(text: string): boolean {
  if (!text) return false;
  return KEYWORD_PATTERN.test(text);
}

function extractText(content: ModelMessage['content']): string {
  if (typeof content === 'string') return content;
  return content
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join(' ');
}

export function isFirstMessageInterfaceRequest(
  messages: readonly ModelMessage[],
): boolean {
  if (messages.length !== 1) return false;
  const [first] = messages;
  if (first.role !== 'user') return false;
  return detectInterfaceRequest(extractText(first.content));
}

export const INTERFACE_REDIRECT_INSTRUCTION = `The user's first message is asking about an app interface feature (sidebar, chat history, settings, dark mode, login, etc.). These are out of scope — this assistant only plans trips. Reply with exactly two short sentences: (1) one sentence acknowledging that interface/UI features are outside what you can help with here, and (2) one sentence pivoting to trip planning with a concrete invitation, e.g. "If you tell me where you're headed and how many days you have — say, three days in Lisbon in late May with a focus on seafood — I can put together a specific plan." Do not list other features, do not apologize at length, do not ask follow-up questions before pivoting.`;
