import { getSchedule } from '@/lib/sheet';
import { userLookup } from '@/lib/slack';

import type { Env } from '@/types';

export async function sendMessageToChannel(env: Env) {
  const today = new Date();

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔔 GLChat Daily Release Reminder',
        emoji: true,
      },
    },
  ];

  const schedule = await getSchedule(env, today);

  if (!schedule) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_⚠️ Script encountered error when fetching schedule data. Please check the execution logs._`,
      },
    });
  } else {
    const pics = await Promise.all(
      [schedule[1], schedule[2], schedule[4]].map((pic) =>
        userLookup(env, pic.email),
      ),
    );

    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<!subteam^S09E9T20CQ0|bocah-assemble>, it's 30 minutes to GLChat Daily Release cutoff time.`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ *Things to prepare before release:*`,
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
                    text: 'Ensure that all latest changes have been ',
                  },
                  {
                    type: 'link',
                    text: 'successfully deployed',
                    url: 'https://github.com/GDP-ADMIN/glchat/commits/main/',
                  },
                  {
                    type: 'text',
                    text: ' on staging',
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Re-confirm all changes to the release to all GLChat development team',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Please notify us on *this thread* if you need additional time for daily cutoff`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🧑‍💻 *Today's PIC:* `,
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
                      text: 'PM',
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
                      text: 'Engineer',
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
                      text: 'QA',
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
                      text: 'Infra',
                      style: { bold: true },
                    },
                  ],
                },
              ],
            },
          ],
          [
            {
              type: 'rich_text',
              elements: [
                {
                  type: 'rich_text_section',
                  elements: [
                    pics[0]
                      ? {
                          type: 'user',
                          user_id: pics[0],
                        }
                      : {
                          type: 'text',
                          text: '⚠️',
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
                    pics[1]
                      ? {
                          type: 'user',
                          user_id: pics[1],
                        }
                      : {
                          type: 'text',
                          text: '⚠️',
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
                    pics[2]
                      ? {
                          type: 'user',
                          user_id: pics[2],
                        }
                      : {
                          type: 'text',
                          text: '⚠️',
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
                    schedule[3].name
                      ? {
                          type: 'link',
                          text: schedule[3].name,
                          url: 'https://mail.google.com/chat/u/0/#chat/space/AAAA_HPfXJU',
                        }
                      : {
                          type: 'text',
                          text: '⚠️',
                        },
                  ],
                },
              ],
            },
          ],
        ],
      },
    );
  }

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
