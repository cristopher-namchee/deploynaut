import type { Context } from 'hono';
import { GLChatMetadata } from '../const';
import type {
  Env,
  GithubCommit,
  GithubRelease,
  InteractivityPayload,
  ReleaseInput,
  ReleasePayload,
} from '../types';

function bumpVersion(version: string): string {
  const hasV = version.startsWith('v');
  const [maj, min, pat] = (hasV ? version.slice(1) : version).split('.');

  if (pat !== undefined) {
    return `${hasV ? 'v' : ''}${maj}.${min}.${String(Number(pat) + 1).padStart(3, '0')}`;
  }

  if (min !== undefined) {
    return `${hasV ? 'v' : ''}${maj}.${Number(min) + 1}`;
  }

  return `${hasV ? 'v' : ''}${Number(maj) + 1}`;
}

function generateReleaseTitle(prefix: string, version: string) {
  const label: Record<string, string> = {
    plgr: 'Beta',
    release: 'Production',
  };

  const tag = prefix === 'plgr' ? version : `${prefix}-${version}`;

  return `Release ${label[prefix] ?? prefix.toUpperCase()} ${tag} - ${new Date().toLocaleDateString(
    'en-GB',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  )}`;
}

async function generateReleaseNote(
  lastCommit: string,
  token: string,
): Promise<string> {
  const targetDate = '';
}

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
        'User-Agent': 'deploynaut',
      },
    });

    return response.status === 200;
  } catch {
    return false;
  }
}

async function validateCommit(commit: string, token: string): Promise<boolean> {
  // allow empty string, will be resolved later.
  if (!commit) {
    return true;
  }

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
        'User-Agent': 'deploynaut',
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
        'User-Agent': 'deploynaut',
      },
    });

    // since the tag shouldn't exist
    return response.status !== 200;
  } catch {
    return false;
  }
}

async function validateInput(
  input: ReleaseInput,
  token: string,
): Promise<Record<string, string>> {
  const [isValidBranch, isValidCommit, isValidTag] = await Promise.all([
    validateBranch(input.branch, token),
    validateCommit(input.commit, token),
    validateTag(`${input.prefix}-${input.version}`, token),
  ]);

  const errors: Record<string, string> = {};

  if (!isValidBranch) {
    errors.branch_input = 'This branch does not exist in the repository';
  }

  if (!isValidCommit && isValidBranch) {
    errors.commit_input = 'This commit SHA does not exist in the repository';
  }

  if (!isValidTag) {
    errors.version_input = 'This tag already exist';
  }

  return errors;
}

async function getLatestRelease(
  prefix: string,
  token: string,
): Promise<{ version: string; publishedAt: string }> {
  const releasesUrl = new URL(
    `repos/${GLChatMetadata.owner}/${GLChatMetadata.repo}/releases`,
    'https://api.github.com/',
  );

  const response = await fetch(releasesUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'deploynaut',
    },
  });

  const releases = (await response.json()) as GithubRelease[];
  releases.sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );

  for (const release of releases) {
    if (release.tag_name.startsWith(prefix)) {
      const [_, version] = release.tag_name.split('-');

      return {
        version,
        publishedAt: release.published_at ?? release.created_at,
      };
    }
  }

  const repoUrl = new URL(
    `repos/${GLChatMetadata.owner}/${GLChatMetadata.repo}`,
    'https://api.github.com/',
  );

  const repoMeta = await fetch(repoUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'deploynaut',
    },
  });

  const repoData = (await repoMeta.json()) as { created_at: string };

  // if somehow not found, use 0.0.000
  return {
    version: '0.0.000',
    publishedAt: repoData.created_at,
  };
}

async function normalizeInput(
  input: ReleaseInput,
  token: string,
): Promise<ReleaseInput> {
  const normalizedInput = { ...input };

  if (!normalizedInput.version) {
    const { version } = await getLatestRelease(normalizedInput.prefix, token);

    normalizedInput.version = bumpVersion(version);
  }

  return normalizedInput;
}

export async function handleReleaseSubmission(
  payload: InteractivityPayload,
  c: Context<{ Bindings: Env }>,
) {
  const { view } = payload as ReleasePayload;
  const { state } = view;

  const input = await normalizeInput(
    {
      prefix: state.values.prefix_input.prefix.value ?? 'release',
      commit: state.values.commit_input.commit.value ?? '',
      branch: state.values.branch_input.branch.value ?? 'main',
      version: state.values.version_input.version.value ?? '',
      draft: !!state.values.release_toggle.toggles.selected_options.find(
        (option) => option.value === 'draft',
      ),
      preRelease: !!state.values.release_toggle.toggles.selected_options.find(
        (option) => option.value === 'pre_release',
      ),
      dryRun: !!state.values.release_toggle.toggles.selected_options.find(
        (option) => option.value === 'dry_run',
      ),
    },
    c.env.GITHUB_TOKEN,
  );

  const errors = await validateInput(input, c.env.GITHUB_TOKEN);
  if (errors) {
    return c.json(
      {
        response_action: 'errors',
        errors,
      },
      200,
    );
  }

  const newVersion = bumpVersion(input.version);
  const releaseTitle = generateReleaseTitle(input.prefix, newVersion);

  return c.text('', 200);
}
