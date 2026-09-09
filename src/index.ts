import { fetch } from './api/app';
import { Schedules } from './const';
import { sendDeploymentReminder } from './scheduler/channel';
import { sendPICReminder } from './scheduler/personal';

import type { Env } from './types';

const schedules: Record<string, (env: Env, project: keyof typeof Schedules) => Promise<void>> = {
  '0 5 * * 2-6': sendPICReminder,
  '30 8 * * 2-6': sendDeploymentReminder,
};

export default {
  fetch,
  scheduled: async (
    ctrl: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    const task = schedules[ctrl.cron];

    for (const schedule of Object.keys(Schedules)) {
      if (task) {
        ctx.waitUntil(task(env, schedule as keyof typeof Schedules));
      }
    }
  },
};
