import { vi } from 'vitest';

export type FakeFile = {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  size?: string;
  trashed?: boolean;
  permissionIds?: string[];
};

export const FOLDER = 'application/vnd.google-apps.folder';
export const ROOT_ID = 'real-root-id';

const DRIVE_URL = 'https://www.googleapis.com/drive/v3';

export const folder = (id: string, name: string, parent = ROOT_ID): FakeFile => ({ id, name, mimeType: FOLDER, parents: [parent] });

export const pdf = (id: string, name: string, parent: string, extra: Partial<FakeFile> = {}): FakeFile => ({
  id,
  name,
  mimeType: 'application/pdf',
  parents: [parent],
  size: '2048',
  ...extra,
});

const nameEquals = /name = '((?:\\.|[^'\\])*)'/;
const inParents = /^'([^']+)' in parents/;

const unescape = (value: string) => value.replace(/\\(.)/g, '$1');

export const useFakeGoogle = (files: FakeFile[]) => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id');
  vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', 'client-secret');
  vi.stubEnv('VITE_GOOGLE_REFRESH_TOKEN', 'refresh-token');

  const requests: { method: string; url: URL; body: unknown }[] = [];
  const respond = (body: unknown, status = 200) => Response.json(body, { status });

  const fetchMock = vi.fn(async (input: URL | string, init: RequestInit = {}) => {
    const url = new URL(input);
    const method = init.method ?? 'GET';
    requests.push({ method, url, body: typeof init.body === 'string' ? JSON.parse(init.body) : init.body });

    if (url.href === 'https://oauth2.googleapis.com/token') return respond({ access_token: 'access-token', expires_in: 3600 });
    if (!url.href.startsWith(DRIVE_URL)) return respond({ error: 'unexpected url' }, 500);

    const path = url.pathname.replace('/drive/v3', '');
    if (path === '/files/root') return respond({ id: ROOT_ID });

    const permissions = path.match(/^\/files\/([^/]+)\/permissions$/);
    if (permissions && method === 'POST') return respond({ id: 'anyoneWithLink' });

    const single = path.match(/^\/files\/([^/]+)$/);
    if (single) {
      const file = files.find((candidate) => candidate.id === decodeURIComponent(single[1] ?? ''));
      return file ? respond({ trashed: false, ...file }) : respond({ error: 'not found' }, 404);
    }

    const q = url.searchParams.get('q') ?? '';
    const parent = q.match(inParents)?.[1];
    const name = q.match(nameEquals)?.[1];
    const matches = files.filter(
      (file) =>
        !file.trashed &&
        (parent === undefined || file.parents.includes(parent === 'root' ? ROOT_ID : parent)) &&
        (name === undefined || file.name === unescape(name)) &&
        (!q.includes(`mimeType = '${FOLDER}'`) || file.mimeType === FOLDER),
    );
    return respond({ files: matches.map(({ id, name: fileName, mimeType, size }) => ({ id, name: fileName, mimeType, size })) });
  });

  vi.stubGlobal('fetch', fetchMock);
  return { requests, fetchMock };
};
