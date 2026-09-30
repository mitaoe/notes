import { Box } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router';

import type { DriveItem } from '../../shared/drive.ts';
import { parseFolderPath, toFolderPath } from '../../shared/folder-path.ts';
import { fetchFolder } from '../api/drive.ts';
import { ErrorAlert } from '../components/ErrorAlert.tsx';
import { FileList } from '../components/FileList.tsx';
import { usePagedFiles } from '../hooks/usePagedFiles.ts';

import classes from './Page.module.css';

const FOLDER_ERROR = 'An error occurred while loading this folder. Please try again.';

export function FolderPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { files, loading, failed, hasMore, loadMore } = usePagedFiles(pathname, fetchFolder);

  const openFolder = (folder: DriveItem) => {
    void navigate(toFolderPath([...(parseFolderPath(pathname) ?? []), folder.name]));
  };

  return (
    <Box className={classes.page}>
      {failed && <ErrorAlert message={FOLDER_ERROR} />}
      <FileList
        key={pathname}
        files={files}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onFolderClick={openFolder}
      />
    </Box>
  );
}
