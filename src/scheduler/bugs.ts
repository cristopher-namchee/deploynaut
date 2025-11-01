import type { Env, GitHubIssue } from '../types';

const GLCHAT_METADATA = {
  owner: 'GDP-ADMIN',
  repo: 'glchat',
};

export async function sendActiveBugReminder(env: Env) {
  const params = new URLSearchParams();
  params.append('labels', 'bug');
  params.append('state', 'open');

  const url = new URL(
    `/repos/${GLCHAT_METADATA.owner}/${GLCHAT_METADATA.repo}/issues`,
    'https://api.github.com',
  );
  url.search = params.toString();

  const bugs = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!bugs.ok) {
    const body = (await bugs.json()) as GitHubIssue[];

    console.log(body);
    throw new Error(
      `Failed to fetch bug list. Response returned ${bugs.status}`,
    );
  }

  const body = (await bugs.json()) as GitHubIssue[];

  const emails = await Promise.all(
    body.map(async (b) => {
      const users = b.assignees;

      if (!users?.length) {
        return [];
      }

      const response = await Promise.all(
        users.map(async (user) => {
          const response = await fetch(user.url, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${env.GITHUB_TOKEN}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
          });

          return response.json();
        }),
      );

      return response;
    }),
  );

  console.log(emails);
}
