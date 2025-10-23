import { Hono } from "hono";

import type { Env } from "./types";

const app = new Hono<{ Bindings: CloudflareBindings }>();

export default {
  fetch: app.fetch,
  scheduler: async (ctrl: ScheduledController, env: Env, ctx: ExecutionContext) => {
    ctrl.cron
    ctx.waitUntil(Promise.resolve(5));
  }
}
