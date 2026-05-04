# Planet Project

A self-evolving chatbot built on Next.js, the Vercel AI SDK, and Drizzle/Neon Postgres. See `VISION.MD` for context.

## Prerequisites

- Node.js 20+
- pnpm 10 (`corepack enable` will pick up the version pinned in `package.json`)
- A Neon (or any Postgres) database
- An Anthropic API key

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Link the project to Vercel and pull env vars (this is how the Neon database is wired up):

   ```bash
   pnpm dlx vercel link
   pnpm dlx vercel env pull .env.local
   ```

   The Neon integration on Vercel populates `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and the various `PG*`/`POSTGRES_*` aliases automatically. `DATABASE_URL_UNPOOLED` is used by `drizzle-kit` for migrations; `DATABASE_URL` is used at runtime.

3. Add the secrets that aren't synced from Vercel to `.env.local`:

   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   CRON_SECRET=some-long-random-string
   ```

4. Push the schema to your database:

   ```bash
   pnpm db:push
   ```

## Running locally

```bash
pnpm dev
```

The app is served at http://localhost:3000.

## Useful scripts

- `pnpm test` — run the Vitest suite once
- `pnpm test:watch` — watch mode
- `pnpm lint` — ESLint
- `pnpm db:studio` — open Drizzle Studio against your database
- `pnpm db:generate` / `pnpm db:migrate` — generate and apply SQL migrations
- `pnpm cron:trigger` — hit the local feature-extraction cron endpoint using `CRON_SECRET` from `.env.local` (requires `pnpm dev` to be running)
