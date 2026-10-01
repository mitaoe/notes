import { vi } from 'vitest';

import { FOLDER_MIME_TYPE } from '../../shared/drive.ts';
import { DRIVE_URL, TOKEN_URL } from '../_lib/google.ts';

type FakeFile = {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  size?: string;
  trashed?: boolean;
  permissionIds?: string[];
};

export const ROOT_ID = 'real-root-id';
export const TOKEN_LIFETIME_S = 3600;

export const folder = (id: string, name: string, parent = ROOT_ID): FakeFile => ({
  id,
  name,
  mimeType: FOLDER_MIME_TYPE,
  parents: [parent],
});

export const pdf = (
  id: string,
  name: string,
  parent: string,
  extra: Partial<FakeFile> = {},
): FakeFile => ({
  id,
  name,
  mimeType: 'application/pdf',
  parents: [parent],
  size: '2048',
  ...extra,
});

const QUOTED = String.raw`'((?:\\.|[^'\\])*)'`;
const CLAUSE = new RegExp(
  String.raw`\s*(?:and\s+)?(?:${QUOTED} in parents|(name|mimeType) (!=|=|contains) ${QUOTED}|trashed = (true|false))`,
  'y',
);

const WORD_START = /(?<![\p{L}\p{N}])[\p{L}\p{N}]/gu;

const unescape = (value: string) => value.replace(/\\(.)/g, '$1');

const startsNameOrWord = (name: string, term: string) => {
  const lowerName = name.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const starts = [0, ...Array.from(lowerName.matchAll(WORD_START), (match) => match.index)];
  return starts.some((start) => lowerName.startsWith(lowerTerm, start));
};

type Predicate = (file: FakeFile) => boolean;

const compare = (field: 'name' | 'mimeType', operator: string, value: string): Predicate => {
  if (operator === '=') return (file) => file[field] === value;
  if (operator === '!=') return (file) => file[field] !== value;
  return (file) => startsNameOrWord(file[field], value);
};

const parseQuery = (q: string): Predicate[] => {
  const predicates: Predicate[] = [];
  CLAUSE.lastIndex = 0;
  while (CLAUSE.lastIndex < q.length) {
    const match = CLAUSE.exec(q);
    if (match === null)
      throw new Error(`Unsupported Drive query near: ${q.slice(CLAUSE.lastIndex)}`);
    const [, parent, field, operator, value, trashed] = match;
    if (parent !== undefined) {
      const parentId = unescape(parent) === 'root' ? ROOT_ID : unescape(parent);
      predicates.push((file) => file.parents.includes(parentId));
    } else if (field === 'name' || field === 'mimeType') {
      predicates.push(compare(field, operator ?? '', unescape(value ?? '')));
    } else {
      predicates.push((file) => (file.trashed ?? false) === (trashed === 'true'));
    }
  }
  return predicates;
};

const respond = (body: unknown, status = 200) => Response.json(body, { status });

type FakeFetch = (input: URL | string, init?: RequestInit) => Promise<Response>;

export const useFakeGoogle = (files: FakeFile[]) => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id');
  vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', 'client-secret');
  vi.stubEnv('VITE_GOOGLE_REFRESH_TOKEN', 'refresh-token');

  const requests: { method: string; url: URL; body: unknown }[] = [];
  const failures = new Map<string, number>();
  const failNext = (path: string, status: number) => failures.set(path, status);

  const fetchMock = vi.fn<FakeFetch>(async (input, init = {}) => {
    const url = new URL(input);
    const method = init.method ?? 'GET';
    requests.push({
      method,
      url,
      body: typeof init.body === 'string' ? JSON.parse(init.body) : init.body,
    });

    if (url.href === TOKEN_URL) {
      return respond({ access_token: `token-${requests.length}`, expires_in: TOKEN_LIFETIME_S });
    }
    if (!url.href.startsWith(DRIVE_URL)) return respond({ error: 'unexpected url' }, 500);

    const path = url.pathname.replace(new URL(DRIVE_URL).pathname, '');
    const failure = failures.get(path);
    if (failure !== undefined) {
      failures.delete(path);
      return respond({ error: 'forced failure' }, failure);
    }
    if (path === '/files/root') return respond({ id: ROOT_ID });

    if (/^\/files\/[^/]+\/permissions$/.test(path) && method === 'POST') {
      return respond({ id: 'anyoneWithLink' });
    }

    const single = path.match(/^\/files\/([^/]+)$/);
    if (single) {
      const file = files.find((candidate) => candidate.id === decodeURIComponent(single[1] ?? ''));
      return file ? respond({ trashed: false, ...file }) : respond({ error: 'not found' }, 404);
    }

    const predicates = parseQuery(url.searchParams.get('q') ?? '');
    const matches = files.filter((file) => predicates.every((predicate) => predicate(file)));
    return respond({
      files: matches.map(({ id, name, mimeType, size }) => ({ id, name, mimeType, size })),
    });
  });

  vi.stubGlobal('fetch', fetchMock);
  return { requests, fetchMock, failNext };
};
