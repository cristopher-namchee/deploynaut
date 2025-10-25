import { getSchedule, userLookup } from '../lib';
import type { Env } from '../types';

export async function sendMessageToChannel(env: Env) {
  const today = new Date();

  const schedule = await getSchedule(env, today);

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔔 Deployment Reminder',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@S09E9T20CQ0|bocah-assemble>, it's 30 minutes to GLChat Daily Release cutoff time.`,
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✅ *Things to prepare before deployment:*`,
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
  ];

  if (schedule) {
    const pics = await Promise.all(
      schedule.slice(1).map(async (pic) => {
        const userId = await userLookup(env, pic);

        return userId;
      }),
    );

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🧑‍💻 *Today's PIC:* ${pics.map((pic) => `<@${pic}>`).join(' ')}`,
      },
    });
  }
}
