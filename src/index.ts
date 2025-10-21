import { Hono } from "hono";

import type { Env } from "./types";

const app = new Hono<{ Bindings: CloudflareBindings }>();

function fetchDeploymentSchedule() {
  const today = new Date();
}

export default {
  fetch: app.fetch,
  scheduler: async (_: ScheduledController, env: Env, ctx: ExecutionContext) => {
    ctx.waitUntil(Promise.resolve(5));
  }
}
