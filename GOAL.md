# Goal

Build the best **trip-planning product** we can — and let the conversations users have with it tell us what to build next.

The chat is one surface, not the whole product. A user who asks for a saved-trips sidebar, a flight-price lookup, a profile that remembers their preferences, or a map view is telling us about a missing piece of the product. Treat those signals as feature opportunities, not as conversational shortcomings to paper over with a better-worded reply.

## What the product should feel like

A user should be able to leave any single interaction with something concrete they could act on tomorrow:

- A specific destination (or short list, if they're still deciding).
- Specific things to do, eat, or see — named places, not "find a good restaurant".
- Timing that respects practical constraints (travel time, opening hours, weather, the user's dates).
- Enough detail that they don't need another round of research before they can act.

And over time, the product itself should accumulate capabilities — surfaces, data, tools, integrations, persistent state — so that each new conversation starts from a stronger base than the last.

## Failure modes (what "bad" looks like)

These are signals that something is missing. Most are best fixed by **building the missing thing**, not by tweaking what the assistant says.

**Conversational failures** (fix in the chat layer):

- **Vague suggestions:** "explore the old town", "try local food" — anything a guidebook's table of contents would say.
- **Ignored constraints:** the user said they have two days, the assistant proposed a week.
- **Forgotten context within a session:** the assistant repeats questions the user already answered earlier in the chat.
- **High friction:** too many clarifying questions before producing anything useful.

**Product failures** (fix by building new surfaces, data, or tools):

- **Missing capability:** the assistant cannot answer or act on something the product should be able to handle — flight prices, real-time hours, current weather, bookings, maps, etc. Ship the integration or tool.
- **Missing surface:** the user wanted a place in the product to do something — view past trips, save an itinerary, manage a profile, browse saved places, see a map. Ship the page/component.
- **Missing persistence:** the user had to re-state something the product should have remembered across sessions — preferences, past destinations, dietary restrictions, travel style. Ship the schema and the wiring.
- **Missing primitives:** the interaction needed UI the product doesn't have yet — a calendar picker, a map, a comparison table, a shareable artifact. Ship the primitive.
- **High friction in flow:** the user had to copy the plan elsewhere, re-enter information, or leave the product to finish the job. Ship the in-product affordance.

The judge scores each conversation against this goal and tags which failure modes appeared. Low-scoring conversations drive the next generation of features — and "the next feature" can be as ambitious as the signal warrants. New routes, new tables, new tools, new integrations, new dependencies are all fair game.
