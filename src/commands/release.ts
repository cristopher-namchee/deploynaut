import type { Context } from 'hono';

import type { Env } from '../types';

async function getBranches(env: Env) {
  const response = await fetch('https://api.github.com/');
}

export async function releaseBeta(c: Context<{ Bindings: Env }>) {
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
          callback_id: 'release',
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
                type: '',
              },
            },
          ],
        },
      }),
    }),
  );
}
