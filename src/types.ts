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

export interface GitHubIssue {
  number: number;
  title: string;
  assignees?: {
    id: number;
    url: string;
    nodeid: number;
  }[];
}
