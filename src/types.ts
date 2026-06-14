export interface Env {
  DAILY_GOOGLE_SPACE: string;

  SCRIPT_URL: string;
  GITHUB_TOKEN: string;

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

export type PIC = [Employee, Employee, Employee, Employee, Employee];

export interface GoogleColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}
