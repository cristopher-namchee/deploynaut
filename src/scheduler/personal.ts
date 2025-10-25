import { getSchedule } from '../gscript';
import type { Env } from '../types';

export async function sendMessageToPICs(env: Env) {
  const today = new Date();

  const schedule = await getSchedule(env, today);

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔔 Deployment PIC Reminder',
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
        text: `To ensure today's deployment go without a hitch, here's some steps that you can take to prepare for the deployment:`,
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
        text: `Good luck during the deployment!`,
      },
    },
  ];

  if (schedule) {
    // exclude daily bug PIC for now.
    await Promise.all(
      schedule.slice(1).map(async (pic) => {
        const response = await fetch(
          'https://slack.com/api/users.lookupByEmail',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ email: pic }),
          },
        );

        if (!response) {
          return console.error(
            `Cannot find user ${pic}. Please check the deployment sheet.`,
          );
        }

        const { id } = (await response.json()) as { id: string };

        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: id,
            blocks,
          }),
        });
      }),
    );
  }
}
