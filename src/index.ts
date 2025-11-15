import { Hono } from 'hono';
import { spawnReleaseDialog } from './commands/release';
import { ReleaseCommand } from './const';
import { handleReleaseSubmission } from './interactivity/release';
import { sendActiveBugReminder } from './scheduler/bugs';
import { sendMessageToChannel } from './scheduler/channel';
import { sendMessageToPICs } from './scheduler/personal';
import type { Env, InteractivityPayload } from './types';

const schedules: Record<string, (env: Env) => Promise<void>> = {
  '0 5 * * 2-6': sendMessageToPICs,
  '30 8 * * 2-6': sendMessageToChannel,
  '0 3 * * *': sendActiveBugReminder,
};

const interactivity = {
  [ReleaseCommand.InteractiveEvent]: handleReleaseSubmission,
};

const app = new Hono<{ Bindings: Env }>();

app.post('/commands/release', spawnReleaseDialog);
app.post('/interactivity', async (c) => {
  const body = (await c.req.parseBody()) as unknown as InteractivityPayload;

  const eventTokens: string[] = [body.type];
  if (body.view) {
    eventTokens.push(body.view.type);
  }
  const event = eventTokens.join(':');

  if (!(event in interactivity)) {
    return c.notFound();
  }

  return interactivity[event](body, c);
});

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
