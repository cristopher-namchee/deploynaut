import type { Context } from 'hono';
import { getGoogleAuthToken, getSchedule } from '@/lib/google';
import type { Env } from '@/types';

export async function GET(c: Context<{ Bindings: Env }>) {
  const date = c.req.query('date') ?? new Date();
  if (Number.isNaN(new Date(date).getTime())) {
    return c.json(
      {
        message: 'Invalid date input',
      },
      400,
    );
  }

  const token = await getGoogleAuthToken(
    c.env.SERVICE_ACCOUNT_EMAIL,
    c.env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!token) {
    return c.json({ message: 'Internal server error' }, 500);
  }

  const schedule = await getSchedule(token, new Date(date));
  if (!schedule) {
    return c.json({ message: 'Internal server error' }, 500);
  }

  return c.json({ data: schedule });
}
