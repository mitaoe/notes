import { useCallback, useEffect, useState } from 'react';

import type { DriveItem, DrivePage } from '../../shared/drive.ts';

export type PageFilter = (files: DriveItem[]) => boolean;

const ANY_PAGE: PageFilter = () => true;

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

  const loadMore = useCallback(
    async (until: PageFilter = ANY_PAGE): Promise<DriveItem[] | null> => {
      if (key === null || nextPageToken === null) return [];
      const update = (change: (previous: LoadedPages) => LoadedPages) =>
        setLoaded((previous) =>
          previous !== null && previous.key === key ? change(previous) : previous,
        );
      const loadFrom = async (pageToken: string, added: DriveItem[]): Promise<DriveItem[]> => {
        const page = (await loadPage(key, pageToken, null)) ?? NO_PAGE;
        update((previous) => ({
          ...previous,
          files: [...previous.files, ...page.files],
          nextPageToken: page.nextPageToken,
          failed: false,
        }));
        const files = [...added, ...page.files];
        return until(page.files) || page.nextPageToken === null
          ? files
          : loadFrom(page.nextPageToken, files);
      };
      try {
        return await loadFrom(nextPageToken, []);
      } catch (error) {
        console.error(error);
        update((previous) => ({ ...previous, failed: true }));
        return null;
      }
    },
    [key, nextPageToken, loadPage],
  );

  return {
    files: current?.files ?? [],
    loading: key !== null && current === null,
    failed: current?.failed ?? false,
    missing: current?.missing ?? false,
    hasMore: nextPageToken !== null,
    loadMore,
  };
};
