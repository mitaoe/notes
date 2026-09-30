import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { isRunnableDevEnvironment, loadEnv, type Plugin } from 'vite';

type ApiModule = { GET?: (request: Request) => Promise<Response> };

const API_PREFIX = '/api/';
const FUNCTION_NAME = /^\/api\/([a-z-]+)$/;

const toRequest = (req: IncomingMessage) => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(name, value);
  }
  return new Request(new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`), { method: req.method ?? 'GET', headers });
};

const send = async (res: ServerResponse, response: Response) => {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.end(Buffer.from(await response.arrayBuffer()));
};

export const serveApi = (): Plugin => ({
  name: 'serve-api',
  apply: 'serve',
  configureServer(server) {
    Object.assign(process.env, loadEnv(server.config.mode, server.config.envDir, 'VITE_GOOGLE_'));

    server.middlewares.use((req, res, next) => {
      const { pathname } = new URL(req.url ?? '/', 'http://localhost');
      if (!pathname.startsWith(API_PREFIX)) {
        next();
        return;
      }

      const environment = server.environments.ssr;
      const name = pathname.match(FUNCTION_NAME)?.[1];
      const file = name === undefined ? null : join(server.config.root, 'api', `${name}.ts`);
      if (file === null || !existsSync(file) || !isRunnableDevEnvironment(environment)) {
        void send(res, Response.json({ error: 'Not found' }, { status: 404 }));
        return;
      }

      environment.runner
        .import<ApiModule>(file)
        .then(async ({ GET }) => {
          if (req.method !== 'GET' || GET === undefined) {
            await send(res, new Response(null, { status: 405, headers: { Allow: 'GET' } }));
            return;
          }
          await send(res, await GET(toRequest(req)));
        })
        .catch(next);
    });
  },
});
