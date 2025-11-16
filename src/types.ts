export interface Env {
  SLACK_BOT_TOKEN: string;
  SLACK_CHANNEL: string;
  SCRIPT_URL: string;
  GITHUB_TOKEN: string;
}

export interface GithubUser {
  login: string;
  name: string;
  email: string | null;
}

export interface GithubIssue {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  user: {
    login: string;
  };
  assignees?: {
    id: number;
    url: string;
    nodeid: number;
  }[];
}

type Interactivity =
  | 'view_submission'
  | 'block_actions'
  | 'shortcut'
  | 'message_actions'
  | 'view_closed';

export interface InteractivityPayload {
  type: Interactivity;
  view: {
    callback_id: string;
  };
}

/* ------------------------
 * Release Types
 * ------------------------
 */
type InputValue = {
  value: string;
};

export interface ReleasePayload extends InteractivityPayload {
  type: 'view_submission';
  view: {
    callback_id: string;
    state: {
      values: {
        prefix_input: {
          prefix: InputValue;
        };
        version_input: {
          version: InputValue;
        };
        branch_input: {
          branch: InputValue;
        };
        commit_input: {
          commit: InputValue;
        };
        release_toggle: {
          toggles: {
            selected_options: [
              {
                value: string;
              },
            ];
          };
        };
      };
    };
  };
}

export interface ReleaseInput {
  prefix: string;
  commit: string;
  branch: string;
  version: string;
  draft: boolean;
  preRelease: boolean;
  dryRun: boolean;
}

export interface GithubRelease {
  tag_name: string;
  created_at: string;
  published_at: string;
}

export interface GithubCommit {
  commit: {
    sha: string;
  };
}
