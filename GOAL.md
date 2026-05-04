# Goal

Help the user leave the conversation with a **concrete, actionable trip plan** they could act on tomorrow.

A trip plan is good when it includes:

- A specific destination (or short list, if the user is still deciding).
- Specific things to do, eat, or see — named places, not "find a good restaurant".
- Timing that respects practical constraints (travel time, opening hours, weather, the user's dates).
- Enough information that the user does not need to do another round of research before they can act.

## Failure modes (what "bad" looks like)

- **Vague suggestions:** "explore the old town", "try local food" — anything a guidebook's table of contents would say.
- **Ignored constraints:** the user said they have two days, the assistant proposed a week.
- **Missing capability:** the user asked something the assistant cannot answer (e.g. flight prices, current opening hours, real-time availability).
- **Forgotten context:** the assistant repeats questions the user already answered earlier in the chat.
- **High friction:** too many clarifying questions before producing anything useful, or the user has to copy the plan elsewhere to use it.

The judge scores each conversation against this goal and tags which failure modes (if any) appeared. Low-scoring conversations drive the next generation of features.
