import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PDF_MIME_TYPE, type DriveItem, type DrivePage } from '../../shared/drive.ts';
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
};

const loader = () =>
  vi.fn<PageLoader>(async (key, pageToken) => {
    const page = pages[pageToken ?? `${key}:first`];
    if (page === undefined) throw new Error(`no page for ${key}`);
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

    await act(() => result.current.loadMore());

    expect(result.current.files.map((file) => file.id)).toEqual(['a1', 'a2']);
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

    await act(() => result.current.loadMore());

    expect(result.current.files.map((file) => file.id)).toEqual(['c1']);
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
