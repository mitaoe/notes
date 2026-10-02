import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import * as v from 'valibot';

import { BROWSER_SERVER_PORT, HOST_MACHINE } from '../e2e/support/browser-server.ts';

const { version } = v.parse(
  v.object({ version: v.string() }),
  JSON.parse(
    readFileSync(new URL('../node_modules/@playwright/test/package.json', import.meta.url), 'utf8'),
  ),
);

const result = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--init',
    '--publish',
    `${BROWSER_SERVER_PORT}:${BROWSER_SERVER_PORT}`,
    `--add-host=${HOST_MACHINE}:host-gateway`,
    '--workdir',
    '/home/pwuser',
    '--user',
    'pwuser',
    `mcr.microsoft.com/playwright:v${version}-noble`,
    'npx',
    '--yes',
    `playwright@${version}`,
    'run-server',
    '--port',
    String(BROWSER_SERVER_PORT),
    '--host',
    '0.0.0.0',
  ],
  { stdio: 'inherit' },
);

process.exitCode = result.status ?? 1;
