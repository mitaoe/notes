import { Box, Title } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import type { DriveItem } from '../../shared/drive.ts';
import { fetchFolderPath, fetchSearch } from '../api/drive.ts';
import { ErrorAlert } from '../components/ErrorAlert.tsx';
import { FileList } from '../components/FileList.tsx';
import type { FolderOpening } from '../components/FileRow.tsx';
import { SearchTitle } from '../components/SearchTitle.tsx';
import { usePagedFiles } from '../hooks/usePagedFiles.ts';
import { useSearchQuery } from '../hooks/useSearchQuery.ts';
import { FolderPage } from './FolderPage.tsx';

import classes from './Page.module.css';

const SEARCH_ERROR = 'An error occurred while searching. Please try again.';
const SEARCH_EMPTY =
  "Much like a professor's office during exam week, nothing here matches your search.";

export function SearchPage() {
  const navigate = useNavigate();
  const query = useSearchQuery();
  const { files, loading, failed, hasMore, loadMore } = usePagedFiles(query, fetchSearch);
  const openingFolder = useRef<AbortController | null>(null);
  const [opening, setOpening] = useState<FolderOpening | null>(null);

  useEffect(() => {
    const pending = openingFolder;
    return () => pending.current?.abort();
  }, []);

  const openFolder = async (folder: DriveItem) => {
    openingFolder.current?.abort();
    const controller = new AbortController();
    openingFolder.current = controller;
    setOpening({ folderId: folder.id, status: 'pending' });
    try {
      const path = await fetchFolderPath(folder.id, controller.signal);
      if (controller.signal.aborted) return;
      if (path === null) setOpening({ folderId: folder.id, status: 'missing' });
      else await navigate(path);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      setOpening({ folderId: folder.id, status: 'failed' });
    }
  };

  if (query === null) return <FolderPage />;

  return (
    <Box className={classes.page}>
      <Title order={2} mb="xl" className={classes.searchTitle}>
        <SearchTitle query={query} loading={loading} failed={failed} empty={files.length === 0} />
      </Title>

      {failed && <ErrorAlert message={SEARCH_ERROR} />}

      <FileList
        files={files}
        loading={loading}
        failed={failed}
        emptyMessage={SEARCH_EMPTY}
        hasMore={hasMore}
        onLoadMore={loadMore}
        folderOpener={{ onOpen: (folder) => void openFolder(folder), opening }}
      />
    </Box>
  );
}
