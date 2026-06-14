import {
  getGoogleAuthToken,
  getSchedule,
  getUserIdByEmail,
  isHoliday,
  sendMessage,
} from '@/lib/google';

import type { Env } from '@/types';

export async function sendDeploymentReminder(env: Env) {
  const token = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!token) {
    return;
  }

  const today = new Date();
  const isExcluded = await isHoliday(token, today);
  if (isExcluded) {
    return;
  }

  const schedule = await getSchedule(token, today);
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

⚠️ _Deploynaut encountered error when fetching schedule data. Please check the execution logs._`,
        }),
      },
    );

    return;
  }

  const employees = await Promise.all(
    [schedule[1], schedule[2], schedule[4], schedule[3]].map((pic) =>
      getUserIdByEmail(pic.email, env.DAILY_GOOGLE_SPACE, token),
    ),
  );

  const message = `🔔 *GLChat Daily Release Reminder*

It's 30 minutes to GLChat Daily Release cutoff time.

✅ *Things to prepare before release:*

- Ensure that all latest changes have been <https://github.com/GDP-ADMIN/glchat/commits/main/|successfully deployed> on staging.
- Re-confirm all changes to the release to all GLChat development team

_Please notify us on *this thread* if you need additional time for daily cutoff_

👨‍💼 *Persons in Charge*

PM: ${employees[0].length ? `<${employees[0]}>` : '⚠️'}
Engineer: ${employees[1].length ? `<${employees[1]}>` : '⚠️'}
QA: ${employees[2].length ? `<${employees[2]}>` : '⚠️'}
Infra: ${employees[3].length ? `<${employees[3]}>` : '⚠️'}`;

  const response = await sendMessage(token, env.DAILY_GOOGLE_SPACE, message);

  if (!response.ok) {
  }
}
