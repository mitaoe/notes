import { Box } from '@mantine/core';
import { useLocation } from 'react-router';

import type { DriveItem } from '../../shared/drive.ts';
import { isAddressable, parseFolderPath, toFolderPath } from '../../shared/folder-path.ts';
import { fetchFolder } from '../api/drive.ts';
import { ErrorAlert } from '../components/ErrorAlert.tsx';
import { FileList } from '../components/FileList.tsx';
import { usePagedFiles } from '../hooks/usePagedFiles.ts';
import { usePageTitle } from '../hooks/usePageTitle.ts';
import { NotFoundPage } from './NotFoundPage.tsx';

import pageClasses from '../styles/page.module.css';

const FOLDER_ERROR = 'An error occurred while loading this folder. Please try again.';
const FOLDER_EMPTY =
  "Much like a professor's office during exam week, this folder appears to be vacant.";
const NOT_FOUND_TITLE = 'Page not found';

export function FolderPage() {
  const { pathname } = useLocation();
  const { files, loading, failed, missing, hasMore, loadMore } = usePagedFiles(
    pathname,
    fetchFolder,
  );
  const names = parseFolderPath(pathname) ?? [];
  usePageTitle(missing ? NOT_FOUND_TITLE : (names.at(-1) ?? null), true);

  if (missing) return <NotFoundPage />;

  const folderHref = (folder: DriveItem) => {
    const path = [...names, folder.name];
    return isAddressable(path) ? toFolderPath(path) : null;
  };

  return (
    <Box className={pageClasses.page}>
      {failed && files.length === 0 && <ErrorAlert message={FOLDER_ERROR} onClose={null} />}
      <FileList
        files={files}
        loading={loading}
        failed={failed}
        emptyMessage={FOLDER_EMPTY}
        errorMessage={FOLDER_ERROR}
        hasMore={hasMore}
        onLoadMore={loadMore}
        folderOpener={{ href: folderHref }}
      />
    </Box>
  );
}
