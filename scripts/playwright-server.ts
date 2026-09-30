import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import * as v from 'valibot';

const PORT = 3000;

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
    `${PORT}:${PORT}`,
    '--add-host=hostmachine:host-gateway',
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
    String(PORT),
    '--host',
    '0.0.0.0',
  ],
  { stdio: 'inherit' },
);

process.exitCode = result.status ?? 1;
