import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('getDb', () => {
  const originalUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalUrl;
    }
  });

  it('throws a clear error when DATABASE_URL is missing', async () => {
    const { getDb } = await import('./index');
    expect(() => getDb()).toThrow('DATABASE_URL is not set');
  });

  it('returns a client and caches it across calls when DATABASE_URL is set', async () => {
    process.env.DATABASE_URL = 'postgres://u:p@example.neon.tech/db?sslmode=require';
    const { getDb } = await import('./index');
    const a = getDb();
    const b = getDb();
    expect(a).toBeDefined();
    expect(a).toBe(b);
  });
});
