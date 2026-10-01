import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PDF_MIME_TYPE, type DriveItem, type DrivePage } from '../../shared/drive.ts';
import { RejectedPageTokenError } from '../api/drive.ts';
import { usePagedFiles, type PageLoader } from './usePagedFiles.ts';

const item = (id: string): DriveItem => ({
  id,
  name: `${id}.pdf`,
  mimeType: PDF_MIME_TYPE,
  size: 1,
});

const pageA: DrivePage = { files: [item('a1')], nextPageToken: 'a:second' };
const pageB: DrivePage = { files: [item('b1')], nextPageToken: null };

const pages: Record<string, DrivePage | null> = {
  'a:first': pageA,
  'a:second': { files: [item('a2')], nextPageToken: null },
  'b:first': pageB,
  'c:first': { files: [item('c1')], nextPageToken: 'c:missing' },
  'gone:first': null,
  'e:first': { files: [item('e1')], nextPageToken: 'e:gone' },
  'e:gone': null,
  'd:first': { files: [item('d1')], nextPageToken: 'd:second' },
  'd:second': { files: [item('d2')], nextPageToken: 'd:third' },
  'd:third': { files: [item('d3')], nextPageToken: null },
};

const loader = () =>
  vi.fn<PageLoader>(async (key, { pageToken }) => {
    const page = pages[pageToken ?? `${key}:first`];
    if (page === undefined) throw new Error(`no page for ${key}`);
    return page;
  });

const ids = (files: DriveItem[] | null | undefined) => files?.map((file) => file.id);

const REJECTED = new Error('400');

const unresolved = () => {};

const deferred = () => {
  let resolve: (page: DrivePage) => void = unresolved;
  const promise = new Promise<DrivePage>((settle) => {
    resolve = settle;
  });
  return { promise, resolve: (page: DrivePage) => resolve(page) };
};

const refreshedLoader = (refreshed: DrivePage | null) =>
  vi.fn<PageLoader>(async (_key, { pageToken, rejectedToken }) => {
    if (pageToken === 'stale') throw new RejectedPageTokenError(pageToken, { cause: REJECTED });
    if (pageToken === null) {
      return rejectedToken === null ? { files: [item('s1')], nextPageToken: 'stale' } : refreshed;
    }
    const page = pages[pageToken];
    if (page === undefined) throw new Error(`no page ${pageToken}`);
    return page;
  });

describe('usePagedFiles', () => {
  it('loads the first page and reports progress', async () => {
    const load = loader();
    const { result } = renderHook(() => usePagedFiles('a', load));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.files.map((file) => file.id)).toEqual(['a1']);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.failed).toBe(false);
  });

  it('appends the next page on loadMore', async () => {
    const load = loader();
    const { result } = renderHook(() => usePagedFiles('a', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    const loaded = await act(() => result.current.loadMore(null));

    expect(ids(loaded)).toEqual(['a1', 'a2']);
    expect(ids(result.current.files)).toEqual(['a1', 'a2']);
    expect(result.current.hasMore).toBe(false);
  });

  it('keeps loading pages until the goal is reached', async () => {
    const load = loader();
    const { result } = renderHook(() => usePagedFiles('d', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    const loaded = await act(() =>
      result.current.loadMore((files) => files.some((file) => file.id === 'd3')),
    );

    expect(ids(loaded)).toEqual(['d1', 'd2', 'd3']);
    expect(result.current.files.map((file) => file.id)).toEqual(['d1', 'd2', 'd3']);
    expect(result.current.hasMore).toBe(false);
  });

  it('shows loading again and replaces the files when the key changes', async () => {
    const load = loader();
    const { result, rerender } = renderHook(({ key }) => usePagedFiles(key, load), {
      initialProps: { key: 'a' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ key: 'b' });

    expect(result.current.loading).toBe(true);
    expect(result.current.files).toEqual([]);
    await waitFor(() => expect(result.current.files.map((file) => file.id)).toEqual(['b1']));
  });

  it('reports failure with an empty list', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = loader();
    const { result } = renderHook(() => usePagedFiles('missing', load));

    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.files).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('ignores a response for a key that is no longer current', async () => {
    const resolvers = new Map<string, (page: DrivePage) => void>();
    const load = vi.fn<PageLoader>(
      (key) =>
        new Promise((resolve) => {
          resolvers.set(key, resolve);
        }),
    );
    const { result, rerender } = renderHook(({ key }) => usePagedFiles(key, load), {
      initialProps: { key: 'a' },
    });

    rerender({ key: 'b' });
    await act(async () => {
      resolvers.get('b')?.(pageB);
      resolvers.get('a')?.(pageA);
    });

    expect(result.current.files.map((file) => file.id)).toEqual(['b1']);
    expect(result.current.loading).toBe(false);
  });

  it('keeps the loaded files and reports failure when loading more fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = loader();
    const { result } = renderHook(() => usePagedFiles('c', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    const loaded = await act(() => result.current.loadMore(null));

    expect(loaded).toBeNull();
    expect(result.current.files.map((file) => file.id)).toEqual(['c1']);
    expect(result.current.failed).toBe(true);
  });

  it('starts again from the first page when the page token is rejected', async () => {
    const load = refreshedLoader({ files: [item('s1')], nextPageToken: 'd:second' });
    const { result } = renderHook(() => usePagedFiles('s', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    const loaded = await act(() => result.current.loadMore(null));

    expect(load).toHaveBeenCalledWith(
      's',
      { pageToken: null, rejectedToken: 'stale' },
      expect.any(AbortSignal),
    );
    expect(ids(loaded)).toEqual(['s1', 'd2']);
    expect(ids(result.current.files)).toEqual(['s1', 'd2']);
    expect(result.current.failed).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });

  it('keeps loading after a restart until the goal is reached', async () => {
    const load = refreshedLoader({ files: [item('s1')], nextPageToken: 'd:second' });
    const { result } = renderHook(() => usePagedFiles('s', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    const loaded = await act(() =>
      result.current.loadMore((files) => files.some((file) => file.id === 'd3')),
    );

    expect(ids(loaded)).toEqual(['s1', 'd2', 'd3']);
    expect(result.current.hasMore).toBe(false);
  });

  it('reports the folder as missing when a later page finds it gone', async () => {
    const load = loader();
    const { result } = renderHook(() => usePagedFiles('e', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    await act(() => result.current.loadMore(null));

    expect(result.current).toMatchObject({ missing: true, failed: false, files: [] });
  });

  it('reports the folder as missing when it is gone on a restart', async () => {
    const load = refreshedLoader(null);
    const { result } = renderHook(() => usePagedFiles('s', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    await act(() => result.current.loadMore(null));

    expect(result.current).toMatchObject({ missing: true, failed: false, files: [] });
  });

  it('keeps showing the loaded files until a restart has caught up', async () => {
    const second = deferred();
    const load = vi.fn<PageLoader>(async (_key, { pageToken, rejectedToken }) => {
      if (pageToken === 'stale') throw new RejectedPageTokenError(pageToken, { cause: REJECTED });
      if (pageToken === 'fresh') return second.promise;
      if (rejectedToken !== null) return { files: [item('s1')], nextPageToken: 'fresh' };
      return { files: [item('s1'), item('s2')], nextPageToken: 'stale' };
    });
    const { result } = renderHook(() => usePagedFiles('s', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    let loading: Promise<DriveItem[] | null> = Promise.resolve(null);
    act(() => {
      loading = result.current.loadMore(null);
    });
    await waitFor(() => expect(load).toHaveBeenCalledTimes(4));

    expect(ids(result.current.files)).toEqual(['s1', 's2']);
    await act(async () => {
      second.resolve({ files: [item('s2'), item('s3')], nextPageToken: null });
      await loading;
    });
    expect(ids(result.current.files)).toEqual(['s1', 's2', 's3']);
  });

  it('keeps the loaded files when a restart fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = vi.fn<PageLoader>(async (_key, { pageToken, rejectedToken }) => {
      if (pageToken === 'stale') throw new RejectedPageTokenError(pageToken, { cause: REJECTED });
      if (pageToken === 'fresh') throw new Error('500');
      if (rejectedToken !== null) return { files: [item('s1')], nextPageToken: 'fresh' };
      return { files: [item('s1'), item('s2')], nextPageToken: 'stale' };
    });
    const { result } = renderHook(() => usePagedFiles('s', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    const loaded = await act(() => result.current.loadMore(null));

    expect(loaded).toBeNull();
    expect(ids(result.current.files)).toEqual(['s1', 's2']);
    expect(result.current.failed).toBe(true);
  });

  it('stops loading pages once the page is gone', async () => {
    const second = deferred();
    const load = vi.fn<PageLoader>(async (_key, { pageToken }) => {
      if (pageToken === 'd:second') return second.promise;
      return pages[pageToken ?? 'd:first'] ?? null;
    });
    const { result, unmount } = renderHook(() => usePagedFiles('d', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    let loading: Promise<DriveItem[] | null> = Promise.resolve([]);
    act(() => {
      loading = result.current.loadMore(() => false);
    });
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    const signal = load.mock.calls[1]?.[2];
    unmount();
    second.resolve({ files: [item('d2')], nextPageToken: 'd:third' });

    expect(await loading).toBeNull();
    expect(signal?.aborted).toBe(true);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('reports failure when the token is rejected again after a restart', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = refreshedLoader({ files: [item('s1')], nextPageToken: 'stale' });
    const { result } = renderHook(() => usePagedFiles('s', load));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    const loaded = await act(() => result.current.loadMore(null));

    expect(loaded).toBeNull();
    expect(ids(result.current.files)).toEqual(['s1']);
    expect(result.current.failed).toBe(true);
  });

  it('reports a key the loader cannot find as missing', async () => {
    const load = loader();
    const { result } = renderHook(() => usePagedFiles('gone', load));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ missing: true, failed: false, files: [] });
  });

  it('stays idle without a key', () => {
    const load = loader();
    const { result } = renderHook(() => usePagedFiles(null, load));

    expect(result.current).toMatchObject({
      loading: false,
      failed: false,
      missing: false,
      hasMore: false,
      files: [],
    });
    expect(load).not.toHaveBeenCalled();
  });
});
