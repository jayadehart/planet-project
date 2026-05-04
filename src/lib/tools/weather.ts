import { tool } from 'ai';
import { z } from 'zod';

export const weather = tool({
  description:
    'Look up current weather and a short forecast for a city. Useful when planning trip days, picking what to pack, or deciding indoor vs outdoor activities. Backed by wttr.in; accepts city names directly.',
  inputSchema: z.object({
    location: z.string().min(1).describe('City or place name, e.g. "Lisbon" or "Kyoto, Japan"'),
  }),
  execute: async ({ location }) => {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
    if (!res.ok) throw new Error(`wttr.in failed: ${res.status}`);
    return await res.json();
  },
});
