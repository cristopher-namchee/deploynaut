interface Employee {
  name: string;
  email: string;
}

type ShiftData = [Employee, Employee, Employee, Employee, Employee];

interface SuccessResponse<T> {
  status: 'success';
  data: T;
}

interface ErrorResponse {
  status: 'failed';
  message: string;
}

type AppsScriptResponse<T = undefined> = SuccessResponse<T> | ErrorResponse;

export async function getSchedule(
  env: Env,
  date: Date,
): Promise<ShiftData | null> {
  const url = new URL(env.SCRIPT_URL);
  const params = new URLSearchParams();

  params.set(
    'date',
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
  );

  url.search = params.toString();

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `Failed to fetch schedule data. AppsScript returned ${response.status}.`,
      );

      return null;
    }

    const body = (await response.json()) as AppsScriptResponse<ShiftData>;
    if (body.status === 'failed') {
      console.error(
        `Failed to fetch schedule data. AppsScript encountered error: ${body.message}.`,
      );

      return null;
    }

    return body.data;
  } catch (err) {
    console.error('Failed to fetch schedule due to the following error: ', err);

    return null;
  }
}
