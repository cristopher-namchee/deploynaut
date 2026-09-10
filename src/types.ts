export interface Env {
  SERVICE_ACCOUNT_EMAIL: string;
  SERVICE_ACCOUNT_PRIVATE_KEY: string;
}

export interface GoogleAuthResponse {
  access_token: string;
}

export interface Employee {
  name: string;
  email: string;
}

export interface Schedule {
  sheet_id: string;
  app_name: string;
  space: string;
  commits: string;
  exec: {
    reminder: string;
    deployment: string;
  };
}

export type PIC = [Employee[], Employee[], Employee[], Employee[], Employee[]];
