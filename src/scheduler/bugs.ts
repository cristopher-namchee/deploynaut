import { getSchedule, userLookup } from '../lib';
import type { Env, GitHubIssue, GithubUser } from '../types';

const GLCHAT_METADATA = {
  owner: 'GDP-ADMIN',
  repo: 'glchat',
};

export async function sendActiveBugReminder(env: Env) {
  const today = new Date();

  const pics = await getSchedule(env, today);
  if (!pics) {
    throw new Error('Failed to get schedule data.');
  }

  const dailyBugPic = await userLookup(env, pics[0].email);

  const params = new URLSearchParams();
  params.append('labels', 'bug');
  params.append('state', 'open');

  const url = new URL(
    `/repos/${GLCHAT_METADATA.owner}/${GLCHAT_METADATA.repo}/issues`,
    'https://api.github.com',
  );
  url.search = params.toString();

  const bugsRequest = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'deploynaut',
    },
  });

  if (!bugsRequest.ok) {
    throw new Error(
      `Failed to fetch bug list. Response returned ${bugsRequest.status}`,
    );
  }

  const bugs = (await bugsRequest.json()) as GitHubIssue[];
  const bugsWithAssignees = await Promise.all(
    bugs.map(async (issue) => {
      const users = issue.assignees;

      if (!users?.length) {
        return {
          title: issue.title,
          number: issue.number,
          url: issue.html_url,
          assignees: [],
        };
      }

      const assigneeData = await Promise.all(
        users.map(async (user) => {
          const userResponse = await fetch(user.url, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${env.GITHUB_TOKEN}`,
              'X-GitHub-Api-Version': '2022-11-28',
              'User-Agent': 'deploynaut',
            },
          });

          const userData = (await userResponse.json()) as GithubUser;
          if (!userData.email) {
            console.log(
              `User ${userData.login} - ${userData.name} hasn't made their email public yet.`,
            );
          }

          return userData;
        }),
      );

      const slackAssignees = await Promise.all(
        assigneeData.map(async ({ email }) => {
          if (!email) {
            return null;
          }

          return userLookup(env, email);
        }),
      );

      return {
        title: issue.title,
        number: issue.number,
        url: issue.html_url,
        created_at: issue.created_at,
        assignees: slackAssignees.filter(Boolean),
      };
    }),
  );

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🐛 GLChat Active Bug List',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Below are the list of <https://github.com/GDP-ADMIN/glchat/issues|currently active bugs in GLChat> per *${today.toLocaleDateString(
          'en-GB',
          {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          },
        )}*.`,
      },
    },
    {
      type: 'table',
      rows: [
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Issue Number',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Type',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Title',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Age',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Assignee(s)',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
        ],
        ...bugsWithAssignees.map((issue) => {
          let typeSection = 'Manual report';
          let actualTitle = issue.title;

          const firstLine = issue.title.indexOf('-');

          if (firstLine !== -1) {
            const probablyType = issue.title.slice(0, firstLine - 1);

            if (probablyType.startsWith('[Gloria Feedback]')) {
              typeSection = probablyType
                .replace('[Gloria Feedback]', '')
                .replace(/issue$/, '')
                .trim();
              actualTitle = issue.title.slice(firstLine + 2);
            }
          }

          const issueAge = Math.round(
            (today.getTime() - new Date(issue.created_at ?? '').getTime()) /
              (1000 * 60 * 60 * 24),
          );

          return [
            {
              type: 'rich_text',
              elements: [
                {
                  type: 'rich_text_section',
                  elements: [
                    {
                      type: 'link',
                      text: issue.number.toString(),
                      url: issue.url,
                    },
                  ],
                },
              ],
            },
            {
              type: 'rich_text',
              elements: [
                {
                  type: 'rich_text_section',
                  elements: [
                    {
                      type: 'text',
                      text: typeSection,
                    },
                  ],
                },
              ],
            },
            {
              type: 'rich_text',
              elements: [
                {
                  type: 'rich_text_section',
                  elements: [
                    {
                      type: 'text',
                      text: actualTitle,
                    },
                  ],
                },
              ],
            },
            {
              type: 'rich_text',
              elements: [
                {
                  type: 'rich_text_section',
                  elements: [
                    {
                      type: 'text',
                      text: `${issueAge} day(s)`,
                    },
                  ],
                },
              ],
            },
            {
              type: 'rich_text',
              elements: [
                {
                  type: 'rich_text_section',
                  elements:
                    issue.assignees.length === 0
                      ? [
                          {
                            type: 'text',
                            text: '⚠️',
                            emoji: true,
                          },
                        ]
                      : issue.assignees.map((assignee) => ({
                          type: 'user',
                          user_id: assignee,
                        })),
                },
              ],
            },
          ];
        }),
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✅ *Things to do as an assignee:*`,
      },
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_list',
          style: 'bullet',
          indent: 0,
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: "Investigate the issue that you've been assigned to.",
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: 'Provide a status update in the issue page.',
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: "If you can't provide a status update to the issue, please state the reason in this thread.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🐛 PIC for Daily Bug Report',
        emoji: true,
      },
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'user',
              user_id: dailyBugPic,
            },
          ],
        },
      ],
    },
  ];

  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: env.SLACK_CHANNEL,
      blocks,
    }),
  });
}
