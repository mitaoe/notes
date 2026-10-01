import * as v from 'valibot';
import { describe, expect, it, vi } from 'vitest';

import { PDF_MIME_TYPE } from '../../shared/drive.ts';
import {
  ApiRequestError,
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

    expect(await fetchFolder('/fy/a%20b', 'token', null)).toEqual(page);

    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe('/api/list');
    expect(url.searchParams.get('path')).toBe('/fy/a%20b');
    expect(url.searchParams.get('pageToken')).toBe('token');
  });

  it('omits a missing page token', async () => {
    const fetchMock = stubFetch(page);
    await fetchFolder('/', null, null);
    expect(requestedUrl(fetchMock).searchParams.has('pageToken')).toBe(false);
  });

  it('treats a missing folder as empty', async () => {
    stubFetch({ error: 'Folder not found' }, 404);
    expect(await fetchFolder('/nope', null, null)).toEqual({ files: [], nextPageToken: null });
  });

  it('throws on server errors', async () => {
    stubFetch({ error: 'Something went wrong' }, 500);
    await expect(fetchFolder('/', null, null)).rejects.toBeInstanceOf(ApiRequestError);
  });

  it('rejects responses that do not match the contract', async () => {
    stubFetch({ files: [{ id: 1 }] });
    await expect(fetchFolder('/', null, null)).rejects.toBeInstanceOf(v.ValiError);
  });
});

describe('fetchSearch', () => {
  it('sends the query', async () => {
    const fetchMock = stubFetch(page);
    await fetchSearch("o'reilly", null, null);
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
});

describe('file links', () => {
  it('point at the redirect endpoints', () => {
    expect(downloadHref('a-b_c')).toBe('/api/download?id=a-b_c');
    expect(previewHref('a-b_c')).toBe('/api/preview?id=a-b_c');
  });
});
