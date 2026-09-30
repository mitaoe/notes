import { useCallback, useEffect, useState } from 'react';

import type { DriveItem, DrivePage } from '../../shared/drive.ts';

export type PageLoader = (
  key: string,
  pageToken: string | null,
  signal: AbortSignal | null,
) => Promise<DrivePage>;

type LoadedPages = {
  key: string;
  files: DriveItem[];
  nextPageToken: string | null;
  failed: boolean;
};

export const usePagedFiles = (key: string | null, loadPage: PageLoader) => {
  const [loaded, setLoaded] = useState<LoadedPages | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (key !== null) {
      loadPage(key, null, controller.signal).then(
        (page) => {
          if (controller.signal.aborted) return;
          setLoaded({ key, files: page.files, nextPageToken: page.nextPageToken, failed: false });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          console.error(error);
          setLoaded({ key, files: [], nextPageToken: null, failed: true });
        },
      );
    }
    return () => controller.abort();
  }, [key, loadPage]);

  const current = loaded !== null && loaded.key === key ? loaded : null;
  const nextPageToken = current?.nextPageToken ?? null;

  const loadMore = useCallback(async () => {
    if (key === null || nextPageToken === null) return;
    const update = (change: (previous: LoadedPages) => LoadedPages) =>
      setLoaded((previous) =>
        previous !== null && previous.key === key ? change(previous) : previous,
      );
    try {
      const page = await loadPage(key, nextPageToken, null);
      update((previous) => ({
        ...previous,
        files: [...previous.files, ...page.files],
        nextPageToken: page.nextPageToken,
        failed: false,
      }));
    } catch (error) {
      console.error(error);
      update((previous) => ({ ...previous, failed: true }));
    }
  }, [key, nextPageToken, loadPage]);

  return {
    files: current?.files ?? [],
    loading: key !== null && current === null,
    failed: current?.failed ?? false,
    hasMore: nextPageToken !== null,
    loadMore,
  };
};
