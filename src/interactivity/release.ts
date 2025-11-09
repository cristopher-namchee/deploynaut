import type { Context } from 'hono';

import type { Env, ReleasePayload } from '../types';

export async function handleReleaseSubmission(
  payload: ReleasePayload,
  c: Context<{ Bindings: Env }>,
) {
  console.log(payload);

  return c.text('', 200);
}
