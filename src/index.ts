import { fetch } from './api/app';
import { Schedules } from './const';
import { sendDeploymentReminder } from './scheduler/channel';
import { sendPICReminder } from './scheduler/personal';

import type { Env, Schedule } from './types';

const schedules: Record<
  string,
  (env: Env, project: Schedule) => Promise<void>
> = {
  '0 5 * * 2-6': sendPICReminder,
  '*/30 * * * 2-6': sendDeploymentReminder,
};

export default {
  fetch,
  scheduled: async (
    ctrl: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    const task = schedules[ctrl.cron];
    if (!task) {
      return;
    }

    const taskType = '0 5 * * 2-6' === ctrl.cron ? 'reminder' : 'deployment';
    const scheduledTime = new Date(ctrl.scheduledTime);

    const currentHour = scheduledTime.getUTCHours();
    const currentMinute = scheduledTime.getUTCMinutes();

    for (const s of Object.values(Schedules)) {
      const schedule = s as Schedule;

      const [hour, minute] = s.exec[taskType].split(':');

      if (Number(hour) === currentHour && Number(minute) === currentMinute) {
        ctx.waitUntil(task(env, schedule));
      }
    }
  },
};
