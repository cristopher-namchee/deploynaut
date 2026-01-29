import { formatDate } from '@/lib/date';
import { getGoogleAuthToken } from '@/lib/google';
import { getSchedule } from '@/lib/sheet';

import type { Env } from '@/types';

export async function sendMessageToPICs(env: Env) {
  const token = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!token) {
    return;
  }

  const today = new Date();
  const schedule = await getSchedule(env, today);

  const text = `## 🔔 GLChat Daily Release PIC Reminder
  
Hello! This is a friendly reminder that you are the deployment PIC for *${formatDate(today)}}*

To ensure today's deployment goes smoothly, here are some steps that you can take to prepare for the deployment:

- Read the <https://docs.google.com/document/d/1bV0_dW_VRaQsJ74rwFdC9J4jejWWk95x57lNOaPSOeI/edit?tab=t.0#heading=h.lgn9p612t3df|Release SOP>
- Ensure that all wanted changes have been <https://github.com/GDP-ADMIN/glchat/commits/main/|successfully deployed> on staging
- Reconfirm all changes to the release to all GLChat development team
- Stands-by in <https://mail.google.com/mail/u/0/#chat/space/AAQA-yhQs0Y|the main channel> from 15:30 (GMT +7) until the release has finished

_Good luck during the deployment!_`;

  if (schedule) {
    // const pics = [schedule[1], schedule[2], schedule[4]];
    const pics = [{ name: 'Cristopher', email: 'cristopher@gdplabs.id' }];

    // exclude daily bug.
    await Promise.all(
      pics.map(async (pic) => {
        const spaceRes = await fetch(
          'https://chat.googleapis.com/v1/spaces:setup',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              space: { spaceType: 'DIRECT_MESSAGE', singleUserBotDm: true },
              memberships: [
                { member: { name: `users/${pic.email}`, type: 'HUMAN' } },
              ],
            }),
          },
        );

        const spaceData = (await spaceRes.json()) as { name: string };
        if (!spaceRes.ok)
          throw new Error(`Space Error: ${JSON.stringify(spaceData)}`);

        const spaceName = spaceData.name;

        if (!spaceName) {
          return Promise.resolve();
        }

        await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
          }),
        });
      }),
    );
  }
}
