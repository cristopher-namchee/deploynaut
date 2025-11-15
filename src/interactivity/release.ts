import type { Context } from 'hono';
import { GLChatMetadata } from '../const';
import type {
  Env,
  InteractivityPayload,
  ReleaseInput,
  ReleasePayload,
} from '../types';

async function validateBranch(branch: string, token: string): Promise<boolean> {
  try {
    const url = new URL(
      `repos/${GLChatMetadata.owner}/${GLChatMetadata.repo}/branches/${branch}`,
      'https://api.github.com/',
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.status === 200;
  } catch {
    return false;
  }
}

async function validateCommit(commit: string, token: string): Promise<boolean> {
  try {
    const url = new URL(
      `repos/${GLChatMetadata.owner}/${GLChatMetadata.repo}/commits/${commit}`,
      'https://api.github.com/',
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.status === 200;
  } catch {
    return false;
  }
}

async function validateTag(tag: string, token: string): Promise<boolean> {
  try {
    const url = new URL(
      `repos/${GLChatMetadata.owner}/${GLChatMetadata.repo}/releases/tags/${tag}`,
      'https://api.github.com/',
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
      },
    });

    // since the tag shouldn't exist
    return response.status !== 200;
  } catch {
    return false;
  }
}

async function validateInput(input: ReleaseInput, token: string) {
  const [isValidBranch, isValidCommit, isValidTag] = await Promise.all([
    validateBranch(input.branch, token),
    validateCommit(input.commit, token),
    validateTag(`${input.prefix}-${input.version}`, token),
  ]);
}

async function getLatestRelease(prefix: string) {
  const url = new URL(
    'repos/${GLChatMetadata.owner}/${GLChatMetadata.repo}/releases',
    'https://api.github.com/',
  );

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function handleReleaseSubmission(
  payload: InteractivityPayload,
  c: Context<{ Bindings: Env }>,
) {
  const { view } = payload as ReleasePayload;
  const { state } = view;

  const cleanedPayload = {
    prefix: state.values.prefix_input.prefix.value ?? 'release',
    commit: state.values.commit_input.commit.value,
    branch: state.values.branch_input.branch.value ?? 'main',
    version: state.values.version_input.version.value,
    draft: state.values.release_toggle.toggles.selected_options.find(
      (option) => option.value === 'draft',
    ),
    preRelease: state.values.release_toggle.toggles.selected_options.find(
      (option) => option.value === 'pre_release',
    ),
    dryRun: state.values.release_toggle.toggles.selected_options.find(
      (option) => option.value === 'dry_run',
    ),
  };

  return c.text('', 200);
}
