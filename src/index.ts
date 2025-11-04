import { Hono } from 'hono';

import { sendActiveBugReminder } from './scheduler/bugs';
import { sendMessageToChannel } from './scheduler/channel';
import { sendMessageToPICs } from './scheduler/personal';
import type { Env } from './types';

const schedules: Record<string, (env: Env) => Promise<void>> = {
  '0 5 * * 2-6': sendMessageToPICs,
  '30 8 * * 2-6': sendMessageToChannel,
  '0 3 * * *': sendActiveBugReminder,
};

const app = new Hono<{ Bindings: CloudflareBindings }>();

export default {
  fetch: app.fetch,
  scheduled: async (
    ctrl: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    const task = schedules[ctrl.cron];

    if (task) {
      ctx.waitUntil(task(env));
    }
  },
};
