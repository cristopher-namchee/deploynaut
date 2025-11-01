export interface Env {
  SLACK_BOT_TOKEN: string;
  SLACK_CHANNEL: string;
  SCRIPT_URL: string;
  GITHUB_TOKEN: string;
}

export interface GitHubIssue {
  assignees?: {
    id: number;
    url: string;
    nodeid: number;
  }[];
}
