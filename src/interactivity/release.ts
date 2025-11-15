import type { Context } from 'hono';

import type { Env, InteractivityPayload, ReleasePayload } from '../types';

export async function handleReleaseSubmission(
  payload: InteractivityPayload,
  c: Context<{ Bindings: Env }>,
) {
  const releasePayload = payload as ReleasePayload;

  return c.text('', 200);
}
