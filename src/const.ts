export const IssueReporter = {
  Form: 'infra-gl',
  Sentry: 'sentry[bot]',
};

export const ReleaseCommand = {
  CallbackID: 'release',
  InteractiveEvent: 'view_submission:release',
};

export const JWT = {
  Scopes: [
    'https://www.googleapis.com/auth/chat.messages.create',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.memberships',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
  Algorithm: 'RS256',
  Grant: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
};

export const SpreadsheetID = '18R2eiVJ_l1PVXNYMNCtYiWR5M-taYdMgLVIMzx9mDIo';
