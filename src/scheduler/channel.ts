import {
  getGoogleAuthToken,
  getSchedule,
  getUserIdByEmail,
  isHoliday,
  sendMessage,
} from '@/lib/google';

import type { Env, Schedule } from '@/types';

export async function sendDeploymentReminder(env: Env, project: Schedule) {
  const token = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!token) {
    return;
  }

  const today = new Date();
  const isExcluded = await isHoliday(token, project.sheet_id, today);
  if (isExcluded) {
    console.log('Current day is holiday. Aborting...');

    return;
  }

  const schedule = await getSchedule(token, project.sheet_id, today);

  if (!schedule) {
    await sendMessage(
      token,
      project.space,
      `🔔 *${project.app_name} Daily Release Reminder*

⚠️ _Deploynaut encountered error when fetching schedule data. Please check the execution logs._`,
    );

    return;
  }

  const employees = await Promise.all(
    [schedule[1], schedule[2], schedule[4], schedule[3]].map((pic) =>
      Promise.all(
        pic.map((p) => getUserIdByEmail(p.email, project.space, token)),
      ),
    ),
  );

  const mentions = employees.map((userIds) => {
    const resolved = userIds.filter(Boolean);

    return resolved.length > 0
      ? resolved.map((id) => `<${id}>`).join(' ')
      : '⚠️';
  });

  const message = `🔔 *${project.app_name} Daily Release Reminder*

It's 30 minutes to ${project.app_name} Daily Release cutoff time.

✅ *Things to prepare before release:*

- Ensure that all latest changes have been <https://github.com/GDP-ADMIN/glchat/commits/main/|successfully deployed> on staging.
- Re-confirm all changes to the release to all ${project.app_name} development team

_Please notify us on *this thread* if you need additional time for daily cutoff_

👨‍💼 *Persons in Charge*

PM: ${mentions[0]}
Engineer: ${mentions[1]}
QA: ${mentions[2]}
Infra: ${mentions[3]}`;

  const response = await sendMessage(token, project.space, message);

  if (!response) {
    console.error('Failed to send message');
  }
}
