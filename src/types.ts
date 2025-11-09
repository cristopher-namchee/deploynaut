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
    type: string;
    callback_id: string;
  };
}

export interface ReleasePayload extends InteractivityPayload {
  type: 'view_submission';
  view: {
    type: 'modal';
    callback_id: string;
  };
}
