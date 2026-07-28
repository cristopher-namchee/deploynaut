import { formatDate } from '@/lib/date';
import {
  getGoogleAuthToken,
  getSchedule,
  getUserIdByEmail,
  isHoliday,
  sendEphmermalMessage,
} from '@/lib/google';

import type { Env } from '@/types';

export async function sendPICReminder(env: Env) {
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
    console.log('Current day is holiday. Aborting...');

    return;
  }

  const schedule = await getSchedule(token, today);
  if (!schedule) {
    return;
  }

  const message = `🔔 *GLChat Daily Release PIC Reminder*

Hello {user}! This is a friendly reminder that you are the deployment PIC for *${formatDate(today)}*

To ensure today's deployment goes smoothly, here are some steps that you can take to prepare for the deployment:

- Read the <https://docs.google.com/document/d/1bV0_dW_VRaQsJ74rwFdC9J4jejWWk95x57lNOaPSOeI/edit?tab=t.0#heading=h.lgn9p612t3df|Release SOP>
- Ensure that all wanted changes have been <https://github.com/GDP-ADMIN/glchat/commits/main/|successfully deployed> on staging
- Reconfirm all changes to the release to all GLChat development team
- Stands-by in <https://mail.google.com/mail/u/0/#chat/space/AAQA-yhQs0Y|this channel> from 15:30 (GMT +7) until the release has finished

_Good luck during the deployment!_`;

  // exclude daily bug PIC
  const employees = [schedule[1], schedule[2], schedule[4]].flat();

  await Promise.all(
    employees.map(async (pic) => {
      const userId = await getUserIdByEmail(
        pic.email,
        env.DAILY_GOOGLE_SPACE,
        token,
      );

      if (!userId) {
        return;
      }

      await sendEphmermalMessage(
        token,
        env.DAILY_GOOGLE_SPACE,
        message.replace('{user}', `<${userId}>`),
        userId,
      );
    }),
  );
}
