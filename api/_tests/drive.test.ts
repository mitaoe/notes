import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FOLDER_MIME_TYPE } from '../../shared/drive.ts';
import { TOKEN_URL } from '../_lib/google.ts';
import { HttpError } from '../_lib/http.ts';
import { ROOT_ID, TOKEN_LIFETIME_S, folder, pdf, useFakeGoogle } from './fake-google.ts';

const loadDrive = () => import('../_lib/drive.ts');

const searchIds = async (query: string) => {
  const { searchFiles } = await loadDrive();
  return (await searchFiles(query, null)).files.map((file) => file.id);
};

const tree = [
  folder('fy', 'fy'),
  folder('journals', '00_journals', 'fy'),
  folder('quoted', "o'reilly & co", 'fy'),
  pdf('am', 'am_journal.pdf', 'journals'),
  pdf('shared', 'Shared_Journal.pdf', 'journals', { permissionIds: ['anyoneWithLink'] }),
  pdf('public', 'public.pdf', 'journals', { permissionIds: ['anyone'] }),
  pdf('viewer', 'viewer.pdf', 'journals', { canShare: false }),
  pdf('binned', 'binned_journal.pdf', 'journals', { trashed: true }),
  {
    id: 'doc',
    name: 'journal notes',
    mimeType: 'application/vnd.google-apps.document',
    parents: ['journals'],
  },
  { id: 'secret', name: '.password', mimeType: 'text/plain', parents: ['journals'] },
  folder('outside', 'outside', 'someone-elses-drive'),
];

const folderLookups = (requests: { url: URL }[]) =>
  requests
    .filter((request) => request.url.searchParams.get('fields') === 'files(id)')
    .map((request) => /name = '([^']*)'/.exec(request.url.searchParams.get('q') ?? '')?.[1]);

const tokenRequests = (requests: { url: URL }[]) =>
  requests.filter((request) => request.url.href === TOKEN_URL);

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('quote', () => {
  it('escapes backslashes before quotes', async () => {
    const { quote } = await loadDrive();
    expect(quote("quinn's paper\\essay")).toBe("'quinn\\'s paper\\\\essay'");
  });
});

describe('searchQuery', () => {
  it('matches every term and keeps the visibility filters', async () => {
    const { searchQuery } = await loadDrive();
    const q = searchQuery("unit 1, o'reilly");
    expect(q).toContain("name contains 'unit'");
    expect(q).toContain("name contains '1'");
    expect(q).toContain("name contains 'o\\'reilly'");
    expect(q).toContain('trashed = false');
    expect(q).toContain("name != '.password'");
    expect(q).toContain("mimeType != 'application/vnd.google-apps.shortcut'");
  });

  it('drops double quotes and query operators from terms', async () => {
    const { searchQuery } = await loadDrive();
    expect(searchQuery('"unit 1"')).toBe(searchQuery('unit 1'));
    expect(searchQuery('a/b:c=d<e>f\\g!=h')).toBe(searchQuery('abcdefgh'));
  });

  it('returns null when only separators are given', async () => {
    const { searchQuery } = await loadDrive();
    expect(searchQuery(' ,| () ')).toBeNull();
  });
});

describe('listFolder', () => {
  it('resolves nested folder names and lists only visible items', async () => {
    const { requests } = useFakeGoogle(tree);
    const { listFolder, PAGE_SIZE } = await loadDrive();

    const page = await listFolder(['fy', '00_journals'], null);

    expect(page?.files.map((file) => file.id).toSorted()).toEqual([
      'am',
      'public',
      'shared',
      'viewer',
    ]);
    const listing = requests.at(-1)?.url;
    expect(listing?.searchParams.get('pageSize')).toBe(String(PAGE_SIZE));
    expect(listing?.searchParams.get('orderBy')).toBe('folder,name,modifiedTime desc');
  });

  it('looks folders up in a stable order', async () => {
    const { requests } = useFakeGoogle(tree);
    const { listFolder } = await loadDrive();

    await listFolder(['fy'], null);

    const lookup = requests.find(
      (request) => request.url.searchParams.get('fields') === 'files(id)',
    );
    expect(lookup?.url.searchParams.get('orderBy')).toBe('createdTime');
    expect(lookup?.url.searchParams.has('corpora')).toBe(false);
  });

  it('converts sizes to numbers and missing sizes to null', async () => {
    useFakeGoogle(tree);
    const { listFolder } = await loadDrive();

    const page = await listFolder(['fy'], null);

    expect(page?.files).toContainEqual({
      id: 'journals',
      name: '00_journals',
      mimeType: FOLDER_MIME_TYPE,
      size: null,
    });
    const files = await listFolder(['fy', '00_journals'], null);
    expect(files?.files.find((file) => file.id === 'am')?.size).toBe(2048);
  });

  it('finds folders whose names contain quotes', async () => {
    useFakeGoogle(tree);
    const { listFolder } = await loadDrive();
    expect(await listFolder(['fy', "o'reilly & co"], null)).not.toBeNull();
  });

  it('returns null for a folder that does not exist', async () => {
    useFakeGoogle(tree);
    const { listFolder } = await loadDrive();
    expect(await listFolder(['fy', 'missing'], null)).toBeNull();
  });

  it('forwards the page token', async () => {
    const { requests } = useFakeGoogle(tree);
    const { listFolder } = await loadDrive();
    await listFolder([], 'next-page');
    expect(requests.at(-1)?.url.searchParams.get('pageToken')).toBe('next-page');
  });

  it('turns a rejected page token into a client error', async () => {
    const { failNext } = useFakeGoogle(tree);
    const { listFolder } = await loadDrive();
    failNext('/files', 400);

    await expect(listFolder([], 'stale-token')).rejects.toEqual(
      new HttpError(400, 'pageToken is invalid'),
    );
  });

  it('reports a failed token refresh as a server error, not a bad page token', async () => {
    const { failNext } = useFakeGoogle(tree);
    const { listFolder } = await loadDrive();
    failNext(TOKEN_URL, 400);

    const failure = listFolder([], 'next-page');

    await expect(failure).rejects.toThrow('Token refresh failed with 400');
    await expect(failure).rejects.not.toBeInstanceOf(HttpError);
  });

  it('checks the path again when a remembered folder lists nothing', async () => {
    const files = tree.map((file) => ({ ...file }));
    useFakeGoogle(files);
    const { listFolder } = await loadDrive();
    await listFolder(['fy', '00_journals'], null);

    for (const file of files) {
      if (file.id === 'journals' || file.parents.includes('journals')) file.trashed = true;
    }

    expect(await listFolder(['fy', '00_journals'], 'next-page')).toBeNull();
  });

  it('finds a folder inside a replaced remembered parent', async () => {
    const files = tree.map((file) => ({ ...file }));
    useFakeGoogle(files);
    const { listFolder } = await loadDrive();
    await listFolder(['fy'], null);

    for (const file of files) {
      if (file.id === 'fy' || file.parents.includes('fy')) file.trashed = true;
    }
    files.push(
      folder('fy-2', 'fy', ROOT_ID),
      folder('sub', 'sub', 'fy-2'),
      pdf('inner', 'inner.pdf', 'sub'),
    );

    expect((await listFolder(['fy', 'sub'], null))?.files.map((file) => file.id)).toEqual([
      'inner',
    ]);
  });

  it('starts a replaced folder from its first page', async () => {
    const files = tree.map((file) => ({ ...file }));
    useFakeGoogle(files);
    const { listFolder } = await loadDrive();
    await listFolder(['fy', '00_journals'], null);

    for (const file of files) {
      if (file.id === 'journals' || file.parents.includes('journals')) file.trashed = true;
    }
    files.push(folder('journals-2', '00_journals', 'fy'), pdf('new', 'new.pdf', 'journals-2'));

    await expect(listFolder(['fy', '00_journals'], 'next-page')).rejects.toMatchObject({
      status: 400,
    });
    expect((await listFolder(['fy', '00_journals'], null))?.files.map((file) => file.id)).toEqual([
      'new',
    ]);
  });

  it('lists an empty folder as empty', async () => {
    useFakeGoogle([...tree, folder('ty', 'ty')]);
    const { listFolder } = await loadDrive();

    expect(await listFolder(['ty'], null)).toEqual({ files: [], nextPageToken: null });
  });

  it('rechecks only the remembered steps of a path', async () => {
    const { requests } = useFakeGoogle(tree);
    const { listFolder } = await loadDrive();
    await listFolder(['fy'], null);
    const before = folderLookups(requests).length;

    expect(await listFolder(['fy', 'nope'], null)).toBeNull();

    expect(folderLookups(requests).slice(before)).toEqual(['nope', 'fy']);
  });

  it('looks a path up only once when nothing was remembered', async () => {
    const { requests } = useFakeGoogle([
      ...tree,
      folder('ty', 'ty'),
      folder('newer', '00_journals', 'fy'),
    ]);
    const { findFolderPath, listFolder } = await loadDrive();

    expect(await findFolderPath('newer')).toBeNull();
    expect(await listFolder(['ty'], null)).toEqual({ files: [], nextPageToken: null });
    expect(await listFolder(['zz', 'nope'], null)).toBeNull();

    expect(folderLookups(requests)).toEqual(['fy', '00_journals', 'ty', 'zz']);
  });

  it('reuses the access token and resolved folder ids', async () => {
    const { requests } = useFakeGoogle(tree);
    const { listFolder } = await loadDrive();

    await listFolder(['fy', '00_journals'], null);
    await listFolder(['fy', '00_journals'], 'next-page');

    expect(tokenRequests(requests)).toHaveLength(1);
    expect(
      requests.filter((request) => request.url.searchParams.get('fields') === 'files(id)'),
    ).toHaveLength(2);
  });
});

describe('access token', () => {
  it('is shared by concurrent requests', async () => {
    const { requests } = useFakeGoogle(tree);
    const { listFolder } = await loadDrive();

    await Promise.all([listFolder([], null), listFolder(['fy'], null)]);

    expect(tokenRequests(requests)).toHaveLength(1);
  });

  it('is refreshed once it expires', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { requests } = useFakeGoogle(tree);
    const { listFolder } = await loadDrive();

    await listFolder([], null);
    vi.setSystemTime(Date.now() + TOKEN_LIFETIME_S * 1000);
    await listFolder([], null);

    expect(tokenRequests(requests)).toHaveLength(2);
  });
});

describe('searchFiles', () => {
  it('returns the items with a word starting with every term', async () => {
    useFakeGoogle(tree);
    expect(await searchIds('00_jour')).toEqual(['journals']);
    expect(await searchIds('journal')).toEqual(['journals', 'am', 'shared']);
    expect(await searchIds('shared JOURNAL')).toEqual(['shared']);
    expect(await searchIds('ournal')).toEqual([]);
  });

  it('hides what listings hide', async () => {
    useFakeGoogle(tree);
    expect(await searchIds('notes')).toEqual([]);
    expect(await searchIds('binned')).toEqual([]);
    expect(await searchIds('.password')).toEqual([]);
  });

  it('skips the Drive call when there are no terms', async () => {
    const { fetchMock } = useFakeGoogle(tree);
    const { searchFiles } = await loadDrive();
    expect(await searchFiles('   ', null)).toEqual({ files: [], nextPageToken: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('findFolderPath', () => {
  it('builds an encoded path up to the drive root', async () => {
    useFakeGoogle(tree);
    const { findFolderPath } = await loadDrive();
    expect(await findFolderPath('journals')).toBe('/fy/00_journals');
    expect(await findFolderPath('quoted')).toBe(`/fy/${encodeURIComponent("o'reilly & co")}`);
  });

  it('returns null for files, unknown ids and folders outside the drive', async () => {
    useFakeGoogle(tree);
    const { findFolderPath } = await loadDrive();
    expect(await findFolderPath('am')).toBeNull();
    expect(await findFolderPath('missing')).toBeNull();
    expect(await findFolderPath('outside')).toBeNull();
    expect(await findFolderPath(ROOT_ID)).toBeNull();
  });

  it('returns null for a folder named like a dot segment', async () => {
    useFakeGoogle([...tree, folder('dots', '..', 'fy'), folder('inside', 'notes', 'dots')]);
    const { findFolderPath } = await loadDrive();

    expect(await findFolderPath('dots')).toBeNull();
    expect(await findFolderPath('inside')).toBeNull();
  });

  it('finds a folder that replaced a remembered one of the same name', async () => {
    const files = tree.map((file) => ({ ...file }));
    useFakeGoogle(files);
    const { findFolderPath, listFolder } = await loadDrive();
    await listFolder(['fy', '00_journals'], null);

    for (const file of files) {
      if (file.id === 'journals' || file.parents.includes('journals')) file.trashed = true;
    }
    files.push(folder('journals-2', '00_journals', 'fy'));

    expect(await findFolderPath('journals-2')).toBe('/fy/00_journals');
  });

  it('returns null for a folder whose path opens an older namesake', async () => {
    useFakeGoogle([...tree, folder('newer', '00_journals', 'fy')]);
    const { findFolderPath } = await loadDrive();
    expect(await findFolderPath('newer')).toBeNull();
    expect(await findFolderPath('journals')).toBe('/fy/00_journals');
  });

  it('retries the root lookup after a failure', async () => {
    const { failNext } = useFakeGoogle(tree);
    const { findFolderPath } = await loadDrive();
    failNext('/files/root', 503);

    await expect(findFolderPath('journals')).rejects.toThrow('/files/root failed');
    expect(await findFolderPath('journals')).toBe('/fy/00_journals');
  });
});

describe('shareFile', () => {
  it('creates a public link permission when the file has none', async () => {
    const { requests } = useFakeGoogle(tree);
    const { shareFile } = await loadDrive();

    expect(await shareFile('am')).toBe(true);

    const permission = requests.find(
      (request) => request.method === 'POST' && request.url.pathname.endsWith('/permissions'),
    );
    expect(permission?.url.pathname).toBe('/drive/v3/files/am/permissions');
    expect(permission?.body).toEqual({ role: 'reader', type: 'anyone' });
  });

  it.each(['shared', 'public'])('does not write when %s is already public', async (id) => {
    const { requests } = useFakeGoogle(tree);
    const { shareFile } = await loadDrive();

    expect(await shareFile(id)).toBe(true);
    expect(
      requests.some((request) => request.method === 'POST' && request.url.href !== TOKEN_URL),
    ).toBe(false);
  });

  it('links a file the account can only view without writing a permission', async () => {
    const { requests } = useFakeGoogle(tree);
    const { shareFile } = await loadDrive();

    expect(await shareFile('viewer')).toBe(true);
    expect(requests.some((request) => request.url.pathname.endsWith('/permissions'))).toBe(false);
  });

  it.each(['journals', 'binned', 'doc', 'secret', 'missing'])('refuses to share %s', async (id) => {
    const { requests } = useFakeGoogle(tree);
    const { shareFile } = await loadDrive();

    expect(await shareFile(id)).toBe(false);
    expect(requests.some((request) => request.url.pathname.endsWith('/permissions'))).toBe(false);
  });
});

describe('file links', () => {
  it('points at Google Drive', async () => {
    const { downloadUrl, previewUrl } = await loadDrive();
    expect(downloadUrl('abc')).toBe('https://drive.google.com/uc?export=download&id=abc');
    expect(previewUrl('abc')).toBe('https://drive.google.com/file/d/abc/preview');
  });
});
