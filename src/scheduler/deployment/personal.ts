import { getSchedule } from '@/lib/sheet';
import { userLookup } from '@/lib/slack';

import type { Env } from '@/types';

export async function sendMessageToPICs(env: Env) {
  const today = new Date();

  const schedule = await getSchedule(env, today);

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔔 GLChat Daily Release PIC Reminder',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hello! This is a friendly reminder that you are the deployment PIC for *${today.toLocaleDateString(
          'en-GB',
          {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          },
        )}*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `To ensure today's deployment goes smoothly, here are some steps that you can take to prepare for the deployment:`,
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
                  text: 'Read the ',
                },
                {
                  type: 'link',
                  text: 'Release SOP',
                  url: 'https://docs.google.com/document/d/1bV0_dW_VRaQsJ74rwFdC9J4jejWWk95x57lNOaPSOeI/edit?tab=t.0#heading=h.lgn9p612t3df',
                },
              ],
            },
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
                  text: ' to staging environment',
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: 'Reconfirm all changes to the release to all GLChat development team',
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: 'Stands-by in ',
                },
                {
                  type: 'channel',
                  channel_id: 'C06D7HWF882',
                },
                {
                  type: 'text',
                  text: ' from ',
                },
                {
                  type: 'text',
                  text: ' 15:30 (GMT +7) ',
                  style: {
                    bold: true,
                  },
                },
                {
                  type: 'text',
                  text: ' until the release is finished.',
                },
              ],
            },
          ],
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Good luck during the deployment!`,
      },
    },
  ];

  if (schedule) {
    const pics = [schedule[1], schedule[2], schedule[4]];

    // exclude daily bug PIC for now.
    await Promise.all(
      pics.map(async (pic) => {
        const userId = await userLookup(env, pic.email);

        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: userId,
            blocks,
          }),
        });
      }),
    );
  }
}
