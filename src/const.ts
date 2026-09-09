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
    id: '18R2eiVJ_l1PVXNYMNCtYiWR5M-taYdMgLVIMzx9mDIo',
    label: 'GLChat',
    space: 'AAQAPaXqGE8',
    commits: 'https://github.com/GDP-ADMIN/glchat/commits/main/',
  },
  aip: {
    id: '1niwmbC9_DEV7-objT316vST-NQxgaulh3Vs8fnug7wQ',
    label: 'GL AIP',
    space: '',
    commits: '',
  },
};
