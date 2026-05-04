import { GITHUB_OWNER, GITHUB_REPO } from "@/lib/constants";

export const GREETING_TITLE = "Where do you want to go?";
export const GREETING_HISTORY_NOTE =
  "There's no chat history sidebar yet — bookmark this page's URL to come back to this conversation.";
export const GREETING_FEATURE_REQUEST_LABEL = "Open an issue on GitHub";

export const FEATURE_REQUEST_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/new`;

export function Greeting() {
  return (
    <div
      data-testid="greeting"
      className="flex flex-col gap-3 text-zinc-700 dark:text-zinc-300"
    >
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {GREETING_TITLE}
      </h2>
      <p className="text-sm leading-relaxed">{GREETING_HISTORY_NOTE}</p>
      <p className="text-sm leading-relaxed">
        Missing something?{" "}
        <a
          href={FEATURE_REQUEST_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          {GREETING_FEATURE_REQUEST_LABEL}
        </a>
        .
      </p>
    </div>
  );
}
