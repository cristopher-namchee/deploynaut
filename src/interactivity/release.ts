import type { Context } from 'hono';

import type { Env, InteractivityPayload, ReleasePayload } from '../types';

function validateInput

export async function handleReleaseSubmission(
  payload: InteractivityPayload,
  c: Context<{ Bindings: Env }>,
) {
  const { view } = payload as ReleasePayload;
  const { state } = view;

  const cleanedPayload = {
    prefix: state.values.prefix_input.prefix.value,
    commit: state.values.commit_input.commit.value,
    branch: state.values.branch_input.branch.value,
    version: state.values.version_input.version.value,
    draft: state.values.release_toggle.toggles.selected_options.find(
      (option) => option.value === 'draft',
    ),
    preRelease: state.values.release_toggle.toggles.selected_options.find(
      (option) => option.value === 'prerelease',
    ),
    dryRun: state.values.release_toggle.toggles.selected_options.find(
      (option) => option.value === 'dry_run',
    ),
  };

  return c.text('', 200);
}
