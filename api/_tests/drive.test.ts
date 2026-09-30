import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FOLDER, ROOT_ID, folder, pdf, useFakeGoogle } from './fake-google.ts';

const loadDrive = () => import('../_lib/drive.ts');

const tree = [
  folder('fy', 'fy'),
  folder('journals', '00_journals', 'fy'),
  folder('quoted', "o'reilly & co", 'fy'),
  pdf('am', 'am_journal.pdf', 'journals'),
  pdf('shared', 'shared.pdf', 'journals', { permissionIds: ['anyoneWithLink'] }),
  pdf('binned', 'binned.pdf', 'journals', { trashed: true }),
  {
    id: 'doc',
    name: 'notes',
    mimeType: 'application/vnd.google-apps.document',
    parents: ['journals'],
  },
  { id: 'secret', name: '.password', mimeType: 'text/plain', parents: ['journals'] },
  folder('outside', 'outside', 'someone-elses-drive'),
];

beforeEach(() => {
  vi.resetModules();
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

  it('returns null when only separators are given', async () => {
    const { searchQuery } = await loadDrive();
    expect(searchQuery(' ,| () ')).toBeNull();
  });
});

describe('listFolder', () => {
  it('resolves nested folder names and lists the last one', async () => {
    const { requests } = useFakeGoogle(tree);
    const { listFolder, PAGE_SIZE } = await loadDrive();

    const page = await listFolder(['fy', '00_journals'], null);

    expect(page?.files.map((file) => file.name)).toContain('am_journal.pdf');
    const listing = requests.at(-1)?.url;
    expect(listing?.searchParams.get('q')).toMatch(/^'journals' in parents and trashed = false/);
    expect(listing?.searchParams.get('pageSize')).toBe(String(PAGE_SIZE));
    expect(listing?.searchParams.get('orderBy')).toBe('folder,name,modifiedTime desc');
  });

  it('converts sizes to numbers and missing sizes to null', async () => {
    useFakeGoogle(tree);
    const { listFolder } = await loadDrive();

    const page = await listFolder(['fy'], null);

    expect(page?.files).toContainEqual({
      id: 'journals',
      name: '00_journals',
      mimeType: FOLDER,
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

  it('reuses the access token and resolved folder ids', async () => {
    const { requests } = useFakeGoogle(tree);
    const { listFolder } = await loadDrive();

    await listFolder(['fy', '00_journals'], null);
    await listFolder(['fy', '00_journals'], 'next-page');

    expect(
      requests.filter((request) => request.url.hostname === 'oauth2.googleapis.com'),
    ).toHaveLength(1);
    expect(
      requests.filter((request) => request.url.searchParams.get('fields') === 'files(id)'),
    ).toHaveLength(2);
  });
});

describe('searchFiles', () => {
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

  it('does not write when the file is already public', async () => {
    const { requests } = useFakeGoogle(tree);
    const { shareFile } = await loadDrive();

    expect(await shareFile('shared')).toBe(true);
    expect(
      requests.some(
        (request) => request.method === 'POST' && request.url.hostname === 'www.googleapis.com',
      ),
    ).toBe(false);
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
