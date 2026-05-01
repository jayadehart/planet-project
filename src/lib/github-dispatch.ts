import type { ExtractedFeature } from './feature-extraction';
import { AGENT_WORKFLOW_DISPATCH_URL } from './constants';

export async function dispatchAgentRun(feature: ExtractedFeature): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');

  const res = await fetch(AGENT_WORKFLOW_DISPATCH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: {
        title: feature.title,
        description: feature.description,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`workflow_dispatch failed: ${res.status} ${body}`);
  }
}
