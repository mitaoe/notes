import { useCallback, useEffect, useState } from 'react';

import type { DriveItem, DrivePage } from '../../shared/drive.ts';

export type PageLoader = (
  key: string,
  pageToken: string | null,
  signal: AbortSignal | null,
) => Promise<DrivePage | null>;

type LoadedPages = {
  key: string;
  files: DriveItem[];
  nextPageToken: string | null;
  failed: boolean;
  missing: boolean;
};

const NO_PAGE: DrivePage = { files: [], nextPageToken: null };

export const usePagedFiles = (key: string | null, loadPage: PageLoader) => {
  const [loaded, setLoaded] = useState<LoadedPages | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (key !== null) {
      loadPage(key, null, controller.signal).then(
        (page) => {
          if (controller.signal.aborted) return;
          const { files, nextPageToken } = page ?? NO_PAGE;
          setLoaded({ key, files, nextPageToken, failed: false, missing: page === null });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          console.error(error);
          setLoaded({ key, files: [], nextPageToken: null, failed: true, missing: false });
        },
      );
    }
    return () => controller.abort();
  }, [key, loadPage]);

  const current = loaded !== null && loaded.key === key ? loaded : null;
  const nextPageToken = current?.nextPageToken ?? null;

  const loadMore = useCallback(async (): Promise<DriveItem[]> => {
    if (key === null || nextPageToken === null) return [];
    const update = (change: (previous: LoadedPages) => LoadedPages) =>
      setLoaded((previous) =>
        previous !== null && previous.key === key ? change(previous) : previous,
      );
    try {
      const page = (await loadPage(key, nextPageToken, null)) ?? NO_PAGE;
      update((previous) => ({
        ...previous,
        files: [...previous.files, ...page.files],
        nextPageToken: page.nextPageToken,
        failed: false,
      }));
      return page.files;
    } catch (error) {
      console.error(error);
      update((previous) => ({ ...previous, failed: true }));
      return [];
    }
  }, [key, nextPageToken, loadPage]);

  return {
    files: current?.files ?? [],
    loading: key !== null && current === null,
    failed: current?.failed ?? false,
    missing: current?.missing ?? false,
    hasMore: nextPageToken !== null,
    loadMore,
  };
};
