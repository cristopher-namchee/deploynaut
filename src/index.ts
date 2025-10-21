import { Hono } from "hono";

import type { Env } from "./types";

const app = new Hono<{ Bindings: CloudflareBindings }>();

const url = "https://script.google.com/macros/s/AKfycbyObK1A9rcv0OOIMF2XnEykQo8MHUkK3iHPekqxQraTCr0dXj9uN17gRo2jzpFrSUESOQ/exec";

function fetchDeploymentSchedule() {
  const today = new Date();
}

export default {
  fetch: app.fetch,
  scheduler: async (_: ScheduledController, env: Env, ctx: ExecutionContext) => {
    ctx.waitUntil(Promise.resolve(5));
  }
}
