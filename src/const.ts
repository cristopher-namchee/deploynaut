export const JWT = {
  Scopes: [
    'https://www.googleapis.com/auth/chat.messages.create',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.memberships',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
  Algorithm: 'RS256',
  Grant: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
};

export const HolidayBackgrounds = ['#f4cccc', '#ea9999', '#ff0000'];

export const Schedules = {
  glchat: {
    sheet_id: '18R2eiVJ_l1PVXNYMNCtYiWR5M-taYdMgLVIMzx9mDIo',
    app_name: 'GLChat',
    space: 'AAQAPaXqGE8',
    commits: 'https://github.com/GDP-ADMIN/glchat/commits/main/',
    exec: {
      reminder: '05:00',
      deployment: '08:30',
    },
  },
  aip: {
    sheet_id: '1niwmbC9_DEV7-objT316vST-NQxgaulh3Vs8fnug7wQ',
    label: 'GL AIP',
    space: 'AAAAvnC4Qyg',
    commits: 'https://github.com/GDP-ADMIN/ai-agent-platform/commits/main-dev/',
    exec: {
      reminder: '05:00',
      deployment: '08:00',
    },
  },
};
