import { Box, Button, Group, Loader, Stack } from '@mantine/core';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useLocation } from 'react-router';

import { PDF_MIME_TYPE, type DriveItem } from '../../shared/drive.ts';
import { BreadcrumbNav } from './BreadcrumbNav.tsx';
import { EmptyState } from './EmptyState.tsx';
import { FilePreview } from './FilePreview.tsx';
import { FileRow } from './FileRow.tsx';

import buttonClasses from '../styles/buttons.module.css';
import classes from './FileList.module.css';

type FileListProps = {
  files: DriveItem[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onFolderClick: (folder: DriveItem) => void;
};

export function FileList({ files, loading, hasMore, onLoadMore, onFolderClick }: FileListProps) {
  const { pathname } = useLocation();
  const [previewFile, setPreviewFile] = useState<DriveItem | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <>
        <BreadcrumbNav key={pathname} pathname={pathname} />
        <Group justify="center" className={classes.loading}>
          <Loader size="lg" type="dots" />
        </Group>
      </>
    );
  }

  return (
    <>
      <BreadcrumbNav key={pathname} pathname={pathname} />
      <Box>
        {files.length === 0 ? (
          <EmptyState />
        ) : (
          <Stack gap="xs">
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                onOpenFolder={onFolderClick}
                onPreview={setPreviewFile}
              />
            ))}
          </Stack>
        )}
        {hasMore && (
          <Group justify="center" mt="md" className={classes.loadMoreRow}>
            <Button
              variant="light"
              loading={loadingMore}
              loaderProps={{ size: 'xs', type: 'dots' }}
              className={clsx(buttonClasses.primary, classes.loadMore)}
              onClick={() => void loadMore()}
            >
              Load More
            </Button>
          </Group>
        )}
      </Box>

      {previewFile && (
        <FilePreview
          key={previewFile.id}
          file={previewFile}
          files={files.filter((file) => file.mimeType === PDF_MIME_TYPE)}
          onSelect={setPreviewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
}
