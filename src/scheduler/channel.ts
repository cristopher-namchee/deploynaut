import { getSchedule } from '../gscript';
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
                  type: 'mrkdwn',
                  text: 'Read the [Release SOP](https://docs.google.com/document/d/1bV0_dW_VRaQsJ74rwFdC9J4jejWWk95x57lNOaPSOeI/edit?tab=t.0#heading=h.lgn9p612t3df)',
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: 'Ensure all changes across the stack have been successfully deployed to staging.',
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: 'Re-confirm all changes to the release to all GLChat development team.',
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
        text: '✔️ *If you have finished using the environment(s):*',
      },
    },
  ];
}
