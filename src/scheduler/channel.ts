import type { Env } from '../types';

export async function sendMessageToChannel(env: Env) {
  const today = new Date();

  const schedule = await getSchedule(env, today);
}
