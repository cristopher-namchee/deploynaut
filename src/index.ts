import { Hono } from 'hono';
import { sendMessageToPICs } from './scheduler/personal';
import type { Env } from './types';

const schedules = {
  '0 5 * * 2-6': sendMessageToPICs,
  '30 8 * * 2-6': sendMessageToChannel,
};

const app = new Hono<{ Bindings: CloudflareBindings }>();

export default {
  fetch: app.fetch,
  scheduler: async (
    ctrl: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    ctrl.cron;
    ctx.waitUntil(Promise.resolve(5));
  },
};
