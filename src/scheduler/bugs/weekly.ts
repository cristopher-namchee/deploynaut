import { IssueReporter } from '@/const';

import type { Env, GithubIssue, GithubUser } from '@/types';

const GLChatMetadata = {
  owner: 'GDP-ADMIN',
  repo: 'glchat',
};

const IssueReporterMap = {
  [IssueReporter.Form]: 'Feedback Form',
  [IssueReporter.Sentry]: 'Sentry',
};

export async function sendActiveBugReminder(env: Env) {
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
        text: `There are *${bugsWithAssignees.length}* of <https://github.com/GDP-ADMIN/glchat/issues|currently active bugs in GLChat> per *${today.toLocaleDateString(
          'en-GB',
          {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          },
        )}*:`,
      },
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
