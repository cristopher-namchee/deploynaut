export interface Env {
  DAILY_GOOGLE_SPACE: string;

  SCRIPT_URL: string;
  GITHUB_TOKEN: string;

  SERVICE_ACCOUNT_EMAIL: string;
  SERVICE_ACCOUNT_PRIVATE_KEY: string;
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

export interface GoogleAuthResponse {
  access_token: string;
}
