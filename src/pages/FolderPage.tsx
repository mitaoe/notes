import { useNavigate, useLocation } from 'react-router';

import type { DriveItem } from '../../shared/drive.ts';
import { parseFolderPath, toFolderPath } from '../../shared/folder-path.ts';
import { fetchFolder } from '../api/drive.ts';
import { FileList } from '../components/FileList.tsx';
import { usePagedFiles } from '../hooks/usePagedFiles.ts';

import classes from './Page.module.css';

export function FolderPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { files, loading, hasMore, loadMore } = usePagedFiles(pathname, fetchFolder);

  const openFolder = (folder: DriveItem) => {
    void navigate(toFolderPath([...(parseFolderPath(pathname) ?? []), folder.name]));
  };

  return (
    <div className={classes.page}>
      <FileList
        files={files}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onFolderClick={openFolder}
      />
    </div>
  );
}
