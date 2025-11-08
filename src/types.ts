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

export interface ReleasePayload {
  type: 'view_submission';
}
