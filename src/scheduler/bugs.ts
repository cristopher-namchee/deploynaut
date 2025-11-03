import type { Env, GitHubIssue, GithubUser } from '../types';

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
    throw new Error(
      `Failed to fetch bug list. Response returned ${bugs.status}`,
    );
  }

  const issues = (await bugs.json()) as GitHubIssue[];
  const issuesWithAssignees = await Promise.all(
    issues.map(async (issue) => {
      const users = issue.assignees;

      if (!users?.length) {
        return [];
      }

      const assigneeData = await Promise.all(
        users.map(async (user) => {
          const userResponse = await fetch(user.url, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${env.GITHUB_TOKEN}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
          });

          const userData = (await userResponse.json()) as GithubUser;
          if (!userData.email) {
            console.log(
              `User ${userData.login} - ${userData.name} hasn't made their email public yet.`,
            );
          }

          return userResponse.json() as Promise<GithubUser>;
        }),
      );

      return {
        title: issue.title,
        number: issue.number,
        assignees: assigneeData
          .map((assignee) => assignee.email)
          .filter(Boolean),
      };
    }),
  );

  console.log(issuesWithAssignees);
}
