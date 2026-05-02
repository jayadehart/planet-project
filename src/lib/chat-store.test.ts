import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllChats } from './chat-store';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('getAllChats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns chat sessions ordered by updatedAt descending', async () => {
    const mockChats = [
      {
        id: 'chat-2',
        title: 'Recent Chat',
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-05-02'),
      },
      {
        id: 'chat-1',
        title: 'Old Chat',
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-15'),
      },
    ];

    const mockOrderBy = vi.fn().mockResolvedValue(mockChats);
    const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof db.select>);

    const result = await getAllChats();

    expect(result).toEqual(mockChats);
    expect(db.select).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockOrderBy).toHaveBeenCalled();
  });

  it('returns empty array when no chats exist', async () => {
    const mockOrderBy = vi.fn().mockResolvedValue([]);
    const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof db.select>);

    const result = await getAllChats();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});
