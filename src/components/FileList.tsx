import { Box, Button, Group, Loader, Stack } from '@mantine/core';
import { useState } from 'react';
import { useLocation } from 'react-router';
import { PDF_MIME_TYPE, type DriveItem } from '../../shared/drive.ts';
import { BreadcrumbNav } from './BreadcrumbNav.tsx';
import { EmptyState } from './EmptyState.tsx';
import classes from './FileList.module.css';
import FilePreview from './FilePreview';
import { FileRow } from './FileRow.tsx';

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

  const step = (offset: number) => {
    if (previewFile === null) return;
    const next = files[files.findIndex((file) => file.id === previewFile.id) + offset];
    if (next) setPreviewFile(next);
  };

  if (loading) {
    return (
      <>
        <BreadcrumbNav pathname={pathname} />
        <Group justify="center" className={classes.loading}>
          <Loader size="lg" type="dots" />
        </Group>
      </>
    );
  }

  return (
    <>
      <BreadcrumbNav pathname={pathname} />
      <Box>
        {files.length === 0 ? (
          <EmptyState />
        ) : (
          <Stack gap="xs">
            {files.map((file) => (
              <FileRow key={file.id} file={file} onOpenFolder={onFolderClick} onPreview={setPreviewFile} />
            ))}
          </Stack>
        )}
        {hasMore && (
          <Group justify="center" mt="md" className={classes.loadMoreRow}>
            <Button
              variant="light"
              loading={loadingMore}
              loaderProps={{ size: 'xs', type: 'dots' }}
              className={classes.loadMore}
              onClick={() => void loadMore()}
            >
              Load More
            </Button>
          </Group>
        )}
      </Box>

      <FilePreview
        key={previewFile?.id}
        opened={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        files={files.filter((file) => file.mimeType === PDF_MIME_TYPE)}
        onNext={() => step(1)}
        onPrevious={() => step(-1)}
      />
    </>
  );
}
