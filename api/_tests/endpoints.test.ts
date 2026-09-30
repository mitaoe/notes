import { beforeEach, describe, expect, it, vi } from 'vitest';
import { folder, pdf, useFakeGoogle } from './fake-google.ts';

const tree = [folder('fy', 'fy'), folder('journals', '00_journals', 'fy'), pdf('am', 'am_journal.pdf', 'journals')];

const get = (url: string) => new Request(`https://notes.test${url}`);

beforeEach(() => {
  vi.resetModules();
});

describe('GET /api/list', () => {
  it('returns the folder page with a CDN cache header', async () => {
    useFakeGoogle(tree);
    const { GET } = await import('../list.ts');

    const response = await GET(get('/api/list?path=/fy/00_journals'));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage=300');
    expect(await response.json()).toEqual({
      files: [{ id: 'am', name: 'am_journal.pdf', mimeType: 'application/pdf', size: 2048 }],
      nextPageToken: null,
    });
  });

  it('decodes percent-encoded folder names', async () => {
    useFakeGoogle([folder('spaced', 'first year')]);
    const { GET } = await import('../list.ts');
    expect((await GET(get(`/api/list?path=${encodeURIComponent('/first%20year')}`))).status).toBe(200);
  });

  it('answers 404 for unknown and malformed paths', async () => {
    useFakeGoogle(tree);
    const { GET } = await import('../list.ts');
    expect((await GET(get('/api/list?path=/nope'))).status).toBe(404);
    expect((await GET(get(`/api/list?path=${encodeURIComponent('/%E0%A4%A')}`))).status).toBe(404);
  });

  it('answers 500 without caching when Drive fails', async () => {
    useFakeGoogle(tree);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 503 })));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { GET } = await import('../list.ts');

    const response = await GET(get('/api/list?path=/'));

    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'Something went wrong' });
  });
});

describe('GET /api/search', () => {
  it('requires a query', async () => {
    useFakeGoogle(tree);
    const { GET } = await import('../search.ts');
    expect((await GET(get('/api/search'))).status).toBe(400);
  });

  it('rejects overly long queries', async () => {
    useFakeGoogle(tree);
    const { GET } = await import('../search.ts');
    expect((await GET(get(`/api/search?q=${'a'.repeat(201)}`))).status).toBe(400);
  });

  it('returns matches', async () => {
    useFakeGoogle(tree);
    const { GET } = await import('../search.ts');
    const response = await GET(get('/api/search?q=journal'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage=300');
  });
});

describe.each([
  ['download', 'https://drive.google.com/uc?export=download&id=am'],
  ['preview', 'https://drive.google.com/file/d/am/preview'],
])('GET /api/%s', (name, location) => {
  const load = async () => (await import(`../${name}.ts`)) as { GET: (request: Request) => Promise<Response> };

  it('shares the file and redirects to Google Drive with a CDN cache header', async () => {
    const { requests } = useFakeGoogle(tree);
    const { GET } = await load();

    const response = await GET(get(`/api/${name}?id=am`));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(location);
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400');
    expect(requests.some((request) => request.url.pathname === '/drive/v3/files/am/permissions')).toBe(true);
  });

  it('answers 404 for folders and unknown files', async () => {
    useFakeGoogle(tree);
    const { GET } = await load();
    expect((await GET(get(`/api/${name}?id=journals`))).status).toBe(404);
    expect((await GET(get(`/api/${name}?id=missing`))).status).toBe(404);
  });

  it('requires a valid id', async () => {
    useFakeGoogle(tree);
    const { GET } = await load();
    expect((await GET(get(`/api/${name}`))).status).toBe(400);
    expect((await GET(get(`/api/${name}?id=a/b`))).status).toBe(400);
  });
});

describe('GET /api/path', () => {
  it('returns the folder path', async () => {
    useFakeGoogle(tree);
    const { GET } = await import('../path.ts');
    const response = await GET(get('/api/path?id=journals'));
    expect(await response.json()).toEqual({ path: '/fy/00_journals' });
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600');
  });

  it('rejects ids that are not Drive ids', async () => {
    useFakeGoogle(tree);
    const { GET } = await import('../path.ts');
    expect((await GET(get('/api/path?id=../files'))).status).toBe(400);
  });

  it('answers 404 for files', async () => {
    useFakeGoogle(tree);
    const { GET } = await import('../path.ts');
    expect((await GET(get('/api/path?id=am'))).status).toBe(404);
  });
});
