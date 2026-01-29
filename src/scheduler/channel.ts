import { getGoogleAuthToken, getUserIdByEmail } from '@/lib/google';
import { getSchedule } from '@/lib/sheet';

import type { Env } from '@/types';

export async function sendMessageToChannel(env: Env) {
  const token = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!token) {
    return;
  }

  const today = new Date();
  const schedule = await getSchedule(env, today);

  if (!schedule) {
    await fetch(
      `https://chat.googleapis.com/v1/spaces/${env.DAILY_GOOGLE_SPACE}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🔔 *GLChat Daily Release Reminder*

⚠️ _Script encountered error when fetching schedule data. Please check the execution logs._`,
        }),
      },
    );

    return;
  }

  const pics = await Promise.all(
    [schedule[1], schedule[2], schedule[4], schedule[3]].map((pic) =>
      getUserIdByEmail(pic.email, env.DAILY_GOOGLE_SPACE, token),
    ),
  );

  await fetch(
    `https://chat.googleapis.com/v1/spaces/${env.DAILY_GOOGLE_SPACE}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `🔔 *GLChat Daily Release Reminder*

<users/all>, it's 30 minutes to GLChat Daily Release cutoff time.

✅ *Things to prepare before release:*

- Ensure that all latest changes have been <https://github.com/GDP-ADMIN/glchat/commits/main/|successfully deployed> on staging.
- Re-confirm all changes to the release to all GLChat development team

_Please notify us on *this thread* if you need additional time for daily cutoff_

👨‍💼 *Persons in Charge*

PM: ${pics[0] ? `<${pics[0]}>` : '⚠️'}
Engineer: ${pics[1] ? `<${pics[1]}>` : '⚠️'}
QA: ${pics[2] ? `<${pics[2]}>` : '⚠️'}
Infra: ${schedule[3] ? `<${pics[3]}>` : '⚠️'}`,
      }),
    },
  );

  return;
}
