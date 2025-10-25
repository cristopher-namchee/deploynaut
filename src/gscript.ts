import type { Env } from './types';

interface SuccessResponse {
  status: 'success';
  data: [string, string, string];
}

interface ErrorResponse {
  status: 'failed';
  message: string;
}

type AppsScriptResponse = SuccessResponse | ErrorResponse;

export async function getSchedule(env: Env, date: Date) {
  const baseUrl = new URL(env.SCRIPT_URL);
  const params = new URLSearchParams();

  params.set(
    'date',
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
  );

  baseUrl.search = params.toString();

  try {
    const response = await fetch(env.SCRIPT_URL);

    if (!response.ok) {
      throw new Error(`AppsScript returned ${response.status}`);
    }

    const body = (await response.json()) as AppsScriptResponse;
    if (body.status === 'failed') {
      throw new Error(body.message);
    }

    return body.data;
  } catch (err) {
    console.error('Failed to fetch schedule due to the following error', err);
  }
}
