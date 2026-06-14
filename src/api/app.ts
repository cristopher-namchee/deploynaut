import { Hono } from 'hono';
import type { Env } from '@/types';
import { GET } from './schedule';

const app = new Hono<{ Bindings: Env }>();
app.get('/schedule', GET);

export const fetch = app.fetch;
