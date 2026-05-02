import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatHistorySidebar } from './chat-history-sidebar';
import * as chatStore from '@/lib/chat-store';

vi.mock('@/lib/chat-store');
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('ChatHistorySidebar', () => {
  it('renders chat history with links', async () => {
    const mockChats = [
      {
        id: 'chat-1',
        title: 'First Chat',
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-05-02'),
      },
      {
        id: 'chat-2',
        title: null,
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-15'),
      },
    ];

    vi.mocked(chatStore.getAllChats).mockResolvedValue(mockChats);

    const component = await ChatHistorySidebar({ currentChatId: 'chat-1' });
    render(component);

    expect(screen.getByText('Chat History')).toBeInTheDocument();
    expect(screen.getByText('First Chat')).toBeInTheDocument();
    expect(screen.getByText('Untitled Chat')).toBeInTheDocument();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('shows empty state when no chats exist', async () => {
    vi.mocked(chatStore.getAllChats).mockResolvedValue([]);

    const component = await ChatHistorySidebar({});
    render(component);

    expect(screen.getByText('Chat History')).toBeInTheDocument();
    expect(screen.getByText('No chats yet')).toBeInTheDocument();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });
});
