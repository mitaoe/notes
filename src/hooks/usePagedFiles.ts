import { useCallback, useEffect, useState } from 'react';

import type { DriveItem, DrivePage } from '../../shared/drive.ts';
import { RejectedPageTokenError } from '../api/drive.ts';

export type LoadGoal = (files: DriveItem[]) => boolean;

const ANY_PAGE: LoadGoal = () => true;

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
  const files = current?.files ?? NO_PAGE.files;
  const nextPageToken = current?.nextPageToken ?? null;

  const loadMore = useCallback(
    async (goal: LoadGoal | null): Promise<DriveItem[] | null> => {
      if (key === null || nextPageToken === null) return files;
      const reached = goal ?? ANY_PAGE;
      const update = (change: (previous: LoadedPages) => LoadedPages) =>
        setLoaded((previous) =>
          previous !== null && previous.key === key ? change(previous) : previous,
        );
      const loadFrom = async (
        pageToken: string | null,
        listed: DriveItem[],
        done: LoadGoal,
      ): Promise<DriveItem[]> => {
        const page = await loadPage(key, pageToken, null);
        if (page === null && pageToken === null) {
          update((previous) => ({ ...previous, files: [], nextPageToken: null, missing: true }));
          return [];
        }
        const { files: pageFiles, nextPageToken: next } = page ?? NO_PAGE;
        const all = [...listed, ...pageFiles];
        update((previous) => ({ ...previous, files: all, nextPageToken: next, failed: false }));
        return done(all) || next === null ? all : loadFrom(next, all, done);
      };
      try {
        try {
          return await loadFrom(nextPageToken, files, reached);
        } catch (error) {
          if (!(error instanceof RejectedPageTokenError)) throw error;
          return await loadFrom(null, [], (all) => all.length > files.length && reached(all));
        }
      } catch (error) {
        console.error(error);
        update((previous) => ({ ...previous, failed: true }));
        return null;
      }
    },
    [key, files, nextPageToken, loadPage],
  );

  return {
    files,
    loading: key !== null && current === null,
    failed: current?.failed ?? false,
    missing: current?.missing ?? false,
    hasMore: nextPageToken !== null,
    loadMore,
  };
};
