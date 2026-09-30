import { Box, Title } from '@mantine/core';
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import type { DriveItem } from '../../shared/drive.ts';
import { fetchFolderPath, fetchSearch } from '../api/drive.ts';
import { ErrorAlert } from '../components/ErrorAlert.tsx';
import { FileList } from '../components/FileList.tsx';
import { SearchTitle } from '../components/SearchTitle.tsx';
import { usePagedFiles } from '../hooks/usePagedFiles.ts';

import classes from './Page.module.css';

const SEARCH_ERROR = 'An error occurred while searching. Please try again.';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const { files, loading, failed, hasMore, loadMore } = usePagedFiles(query || null, fetchSearch);
  const openingFolder = useRef<AbortController | null>(null);

  useEffect(() => {
    const opening = openingFolder;
    return () => opening.current?.abort();
  }, []);

  const openFolder = async (folder: DriveItem) => {
    openingFolder.current?.abort();
    const controller = new AbortController();
    openingFolder.current = controller;
    try {
      const path = await fetchFolderPath(folder.id, controller.signal);
      await navigate(path);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      await navigate('/404');
    }
  };

  return (
    <Box className={classes.page}>
      {query && (
        <Title order={2} mb="xl" className={classes.searchTitle}>
          <SearchTitle query={query} loading={loading} failed={failed} empty={files.length === 0} />
        </Title>
      )}

      {failed && <ErrorAlert message={SEARCH_ERROR} />}

      <FileList
        key={query}
        files={files}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onFolderClick={(folder) => void openFolder(folder)}
      />
    </Box>
  );
}
