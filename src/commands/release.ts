import type { Context } from 'hono';
import { ReleaseCommand } from '../const';
import type { Env } from '../types';

export async function spawnReleaseDialog(c: Context<{ Bindings: Env }>) {
  const body = await c.req.parseBody();
  const triggerId = body.trigger_id;

  c.executionCtx.waitUntil(
    fetch('https://slack.com/api/views.open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${c.env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        trigger_id: triggerId,
        view: {
          type: 'modal',
          callback_id: ReleaseCommand.CallbackID,
          title: { type: 'plain_text', text: 'Release GLChat' },
          submit: { type: 'plain_text', text: 'Release' },
          close: { type: 'plain_text', text: 'Cancel' },
          blocks: [
            {
              type: 'input',
              block_id: 'prefix_input',
              element: {
                type: 'plain_text_input',
                action_id: 'prefix',
              },
              label: {
                type: 'plain_text',
                text: 'Prefix',
              },
              hint: {
                type: 'plain_text',
                text: "e.g: 'plgr'. Defaults to 'release'",
              },
            },
            {
              type: 'input',
              block_id: 'version_input',
              element: {
                type: 'plain_text_input',
                action_id: 'version',
              },
              label: {
                type: 'plain_text',
                text: 'Version',
              },
              hint: {
                type: 'plain_text',
                text: 'e.g; 0.6.123. Defaults to patch semver bump',
              },
            },
            {
              type: 'input',
              block_id: 'branch_input',
              element: {
                type: 'plain_text_input',
                action_id: 'branch',
              },
              label: {
                type: 'plain_text',
                text: 'Branch',
              },
              hint: {
                type: 'plain_text',
                text: "Target branch. Defaults to 'main'",
              },
            },
            {
              type: 'input',
              block_id: 'commit',
              element: {
                type: 'plain_text_input',
                action_id: 'commit',
              },
              label: {
                type: 'plain_text',
                text: 'Commit ID',
              },
              hint: {
                type: 'plain_text',
                text: 'Specific commit SHA to cut off the release. Defaults to latest',
              },
            },
            {
              type: 'input',
              block_id: 'release_toggle',
              element: {
                type: 'checkboxes',
                action_id: 'toggles',
                options: [
                  {
                    text: {
                      type: 'plain_text',
                      text: 'Create as a draft release',
                    },
                    value: 'draft',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: 'Mark as pre-release',
                    },
                    value: 'prerelease',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: 'Conduct a dry-run instead',
                    },
                    value: 'dry_run',
                  },
                ],
              },
              label: {
                type: 'plain_text',
                text: 'Release Settings',
              },
            },
          ],
        },
      }),
    }),
  );

  return c.text('OK', 200);
}
