import type { Env, ReleasePayload } from '../types';

export async function handleReleaseSubmission(
  payload: ReleasePayload,
  env: Env,
) {
  console.log(payload);
}
