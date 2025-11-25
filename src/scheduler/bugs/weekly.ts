import { IssueReporter } from '@/const';
import { formatDate } from '@/lib/date';
import { getWeeklyBugList } from '@/lib/sheet';

import type { Env } from '@/types';

const GLChatMetadata = {
  owner: 'GDP-ADMIN',
  repo: 'glchat',
};

const IssueReporterMap = {
  [IssueReporter.Form]: 'Feedback Form',
  [IssueReporter.Sentry]: 'Sentry',
};

export async function sendWeeklyBugReport(env: Env) {
  const weeklyStats = await getWeeklyBugList(env);

  // should be Saturday
  const today = new Date();
  const prevSunday = new Date(today);
  prevSunday.setDate(today.getDate() - 6);

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 GLChat Weekly Bug Report',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Below is the curated report of <https://github.com/GDP-ADMIN/glchat/issues|active bugs in GLChat> from *${formatDate(prevSunday)}* until *${formatDate(today)}*`,
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
