import { useCallback, useEffect, useRef, useState } from 'react';

import type { DriveItem, DrivePage } from '../../shared/drive.ts';
import { FIRST_PAGE, RejectedPageTokenError, type PageRequest } from '../api/drive.ts';

export type LoadGoal = (files: DriveItem[]) => boolean;

const ONE_PAGE: LoadGoal = () => true;

export type PageLoader = (
  key: string,
  page: PageRequest,
  signal: AbortSignal,
) => Promise<DrivePage | null>;

type LoadedPages = {
  key: string;
  files: DriveItem[];
  nextPageToken: string | null;
  failed: boolean;
  missing: boolean;
};

const NO_FILES: DriveItem[] = [];

export const usePagedFiles = (key: string | null, loadPage: PageLoader) => {
  const [loaded, setLoaded] = useState<LoadedPages | null>(null);
  const keyRequests = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    keyRequests.current = controller;
    if (key !== null) {
      loadPage(key, FIRST_PAGE, controller.signal).then(
        (page) => {
          if (controller.signal.aborted) return;
          setLoaded({
            key,
            files: page?.files ?? NO_FILES,
            nextPageToken: page?.nextPageToken ?? null,
            failed: false,
            missing: page === null,
          });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          console.error(error);
          setLoaded({ key, files: NO_FILES, nextPageToken: null, failed: true, missing: false });
        },
      );
    }
    return () => controller.abort();
  }, [key, loadPage]);

  const current = loaded !== null && loaded.key === key ? loaded : null;
  const files = current?.files ?? NO_FILES;
  const nextPageToken = current?.nextPageToken ?? null;

  const loadMore = useCallback(
    async (goal: LoadGoal | null): Promise<DriveItem[] | null> => {
      const signal = keyRequests.current?.signal;
      if (key === null || nextPageToken === null || signal === undefined) return files;
      const reached = goal ?? ONE_PAGE;
      const update = (change: (previous: LoadedPages) => LoadedPages) =>
        setLoaded((previous) =>
          previous !== null && previous.key === key ? change(previous) : previous,
        );
      let shown = files.length;
      const show = (listed: DriveItem[], next: string | null) => {
        shown = listed.length;
        update((previous) => ({ ...previous, files: listed, nextPageToken: next, failed: false }));
      };
      const collect = async (
        page: PageRequest,
        listed: DriveItem[],
        done: LoadGoal,
        onPage: (listed: DriveItem[], next: string | null) => void,
      ): Promise<DrivePage | null> => {
        signal.throwIfAborted();
        const result = await loadPage(key, page, signal);
        if (result === null) return null;
        const all = [...listed, ...result.files];
        onPage(all, result.nextPageToken);
        return done(all) || result.nextPageToken === null
          ? { files: all, nextPageToken: result.nextPageToken }
          : collect({ pageToken: result.nextPageToken, rejectedToken: null }, all, done, onPage);
      };
      const restart = async (rejectedToken: string) => {
        const restarted = await collect(
          { pageToken: null, rejectedToken },
          [],
          (all) => all.length > shown && reached(all),
          () => {},
        );
        if (restarted !== null) show(restarted.files, restarted.nextPageToken);
        return restarted;
      };
      try {
        const result = await collect(
          { pageToken: nextPageToken, rejectedToken: null },
          files,
          reached,
          show,
        ).catch((error: unknown) => {
          if (error instanceof RejectedPageTokenError) return restart(error.pageToken);
          throw error;
        });
        if (result === null) {
          update((previous) => ({
            ...previous,
            files: NO_FILES,
            nextPageToken: null,
            missing: true,
          }));
          return NO_FILES;
        }
        return result.files;
      } catch (error) {
        if (signal.aborted) return null;
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
