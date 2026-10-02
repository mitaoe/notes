import { setTimeout as delay } from 'node:timers/promises';

import { BROWSER_SERVER_URL } from '../e2e/support/browser-server.ts';

const WAIT_LIMIT_MS = 180_000;
const RETRY_DELAY_MS = 2_000;

const isUp = () =>
  fetch(BROWSER_SERVER_URL).then(
    () => true,
    () => false,
  );

const waitUntilUp = async (deadline: number): Promise<void> => {
  if (await isUp()) return;
  if (Date.now() > deadline) throw new Error(`${BROWSER_SERVER_URL} did not start in time`);
  await delay(RETRY_DELAY_MS);
  return waitUntilUp(deadline);
};

await waitUntilUp(Date.now() + WAIT_LIMIT_MS);
