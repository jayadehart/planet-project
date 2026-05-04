# Vision

A self evolving chatbot. Chatbots are a great starting point for a project like this because:

1. They naturally capture a lot of user interactions through chat messages.
2. There are a lot of things that chat can branch out to, making feature requests a natural evolution. Artifacts, tool usage, web search and more could all be natural extensions of a chat interface.

## Decisions

1. **Keep the base app fairly simple.** Given the recommended time alotted for this task I decided to keep the base application fairly simple. It is just a chat app running on the vercel AI sdk + drizzle for chat message persistance.
2. **Claude code via github workflows as the agent.** Claude and github already have an existing integration framework that makes it easy to use a claude code instance inside a github workflow, and have it create pull requests. Using a github workflow also enables manual testing vs. waiting for the cron job to fire. Claude code is also my daily driver for ai code assistance so I am familiar with the settings and configuration.
3. **Sequential agent runs.** `concurrency: agent-runs, cancel-in-progress: false.` ensures each agent recieves the latest main as a starting point for their feature branch.
4. **Tests and type checking in the CI flow.** This is something pretty simple to implement that minimizes the chance of the agent merging a PR that breaks the app. Having agents write tests with their feature branch also helps prevent regression if those features are touched in the future.
5. **Auto merge flag.** Controls if claude PRs are auto merged or require human review. Nice to have if you're worried about claude breaking the app.

## Tradeoffs

1. **Sonnet 4.5 as the agent.** Obvious tradeoff, opus is much better but tokens aren't free and this is just a small demo.
2. **The feature extraction pipeline has a number of tradeoffs that make sense for the small scope of this project but wouldn't scale well.** It uses a daily cadence cron job because that is the highest frequency vercel offers for free. It also uses a watermark to process all unseen messages since the last run for features in 1 LLM call. This will obviously fail if a high number of messages accumulate and overwhelm the context window of the agent. If this workflow were to accomodate higher number of messages it would make sense to run the job more frequently and to batch messages by a predermined amount to keep context usage consistant.
3. **Small initial app surface area.** Again, mostly a time based constraint. I think giving the app more initial features would have theoritically opened more avenues for natural feature requests / interesting user interaction patterns.
4. **Feature tracking / deduplication.** One idea for future improvement I had was persisting each developed feature in a database. You could then display a log of all the features built over time to track the improvements. You could also query this data at feature extraction time to prevent duplicate features and give the feature request agent a better picture of the current app state.
