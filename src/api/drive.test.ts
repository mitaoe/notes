import * as v from 'valibot';
import { describe, expect, it, vi } from 'vitest';

import { PDF_MIME_TYPE } from '../../shared/drive.ts';
import {
  ApiRequestError,
  FIRST_PAGE,
  RejectedPageTokenError,
  downloadHref,
  fetchFolder,
  fetchFolderPath,
  fetchSearch,
  previewHref,
} from './drive.ts';

const page = {
  files: [{ id: 'a', name: 'a.pdf', mimeType: PDF_MIME_TYPE, size: 3 }],
  nextPageToken: 'next',
};

const stubFetch = (body: unknown, status = 200) => {
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json(body, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const requestedUrl = (fetchMock: ReturnType<typeof stubFetch>) => {
  const input = fetchMock.mock.calls[0]?.[0];
  return new URL(typeof input === 'string' ? input : '', 'https://notes.test');
};

describe('fetchFolder', () => {
  it('requests the folder path and page token', async () => {
    const fetchMock = stubFetch(page);

    expect(
      await fetchFolder('/fy/a%20b', { pageToken: 'token', rejectedToken: null }, null),
    ).toEqual(page);

    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe('/api/list');
    expect(url.searchParams.get('path')).toBe('/fy/a%20b');
    expect(url.searchParams.get('pageToken')).toBe('token');
  });

  it('asks for a fresh first page after a rejected token', async () => {
    const fetchMock = stubFetch(page);
    await fetchFolder('/', { pageToken: null, rejectedToken: 'stale' }, null);

    const url = requestedUrl(fetchMock);
    expect(url.searchParams.get('rejected')).toBe('stale');
    expect(url.searchParams.has('pageToken')).toBe(false);
  });

  it('omits a missing page token', async () => {
    const fetchMock = stubFetch(page);
    await fetchFolder('/', FIRST_PAGE, null);
    expect(requestedUrl(fetchMock).searchParams.has('pageToken')).toBe(false);
    expect(requestedUrl(fetchMock).searchParams.has('rejected')).toBe(false);
  });

  it('returns null for a missing folder', async () => {
    stubFetch({ error: 'Folder not found' }, 404);
    expect(await fetchFolder('/nope', FIRST_PAGE, null)).toBeNull();
  });

  it('throws on server errors', async () => {
    stubFetch({ error: 'Something went wrong' }, 500);
    await expect(fetchFolder('/', FIRST_PAGE, null)).rejects.toBeInstanceOf(ApiRequestError);
  });

  it('reports a page token the API rejects', async () => {
    stubFetch({ error: 'pageToken is invalid' }, 400);
    await expect(
      fetchFolder('/', { pageToken: 'stale', rejectedToken: null }, null),
    ).rejects.toMatchObject({ pageToken: 'stale' });
    await expect(
      fetchSearch('notes', { pageToken: 'stale', rejectedToken: null }, null),
    ).rejects.toBeInstanceOf(RejectedPageTokenError);
  });

  it('reports a rejected first page as a request error', async () => {
    stubFetch({ error: 'q is required' }, 400);
    await expect(fetchSearch('', FIRST_PAGE, null)).rejects.toBeInstanceOf(ApiRequestError);
  });

  it('rejects responses that do not match the contract', async () => {
    stubFetch({ files: [{ id: 1 }] });
    await expect(fetchFolder('/', FIRST_PAGE, null)).rejects.toBeInstanceOf(v.ValiError);
  });
});

describe('fetchSearch', () => {
  it('sends the query', async () => {
    const fetchMock = stubFetch(page);
    await fetchSearch("o'reilly", FIRST_PAGE, null);
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe('/api/search');
    expect(url.searchParams.get('q')).toBe("o'reilly");
  });
});

describe('fetchFolderPath', () => {
  it('returns the resolved path', async () => {
    stubFetch({ path: '/fy/00_journals' });
    expect(await fetchFolderPath('abc', null)).toBe('/fy/00_journals');
  });

  it('returns null for a folder it cannot place', async () => {
    stubFetch({ error: 'Folder not found' }, 404);
    expect(await fetchFolderPath('abc', null)).toBeNull();
  });

  it('throws on server errors', async () => {
    stubFetch({ error: 'Something went wrong' }, 500);
    await expect(fetchFolderPath('abc', null)).rejects.toBeInstanceOf(ApiRequestError);
  });
});

describe('file links', () => {
  it('point at the redirect endpoints', () => {
    expect(downloadHref('a-b_c')).toBe('/api/download?id=a-b_c');
    expect(previewHref('a-b_c')).toBe('/api/preview?id=a-b_c');
  });
});
