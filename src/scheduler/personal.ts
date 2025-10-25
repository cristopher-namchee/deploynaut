import type { Env } from '../types';

function fetchDeploymentSchedule() {
  const today = new Date();
}

export default {
  schedule: '0 5 * * 2-6',
  handler: (env: Env) => {},
};
