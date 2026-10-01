import { Box, Button, Group, Loader, Stack } from '@mantine/core';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useLocation } from 'react-router';

import { isPdf, type DriveItem } from '../../shared/drive.ts';
import type { LoadGoal } from '../hooks/usePagedFiles.ts';
import { BreadcrumbNav } from './BreadcrumbNav.tsx';
import { EmptyState } from './EmptyState.tsx';
import { ErrorAlert } from './ErrorAlert.tsx';
import { FilePreview } from './FilePreview.tsx';
import { FileRow, type FolderOpener } from './FileRow.tsx';

import buttonClasses from '../styles/buttons.module.css';
import classes from './FileList.module.css';

const pdfAfter = (files: DriveItem[], from: DriveItem) => {
  const pdfs = files.filter(isPdf);
  const index = pdfs.findIndex((file) => file.id === from.id);
  return index === -1 ? null : (pdfs[index + 1] ?? null);
};

type FileListProps = {
  files: DriveItem[];
  loading: boolean;
  failed: boolean;
  emptyMessage: string;
  errorMessage: string;
  hasMore: boolean;
  onLoadMore: (goal: LoadGoal | null) => Promise<DriveItem[] | null>;
  folderOpener: FolderOpener;
};

export function FileList({
  files,
  loading,
  failed,
  emptyMessage,
  errorMessage,
  hasMore,
  onLoadMore,
  folderOpener,
}: FileListProps) {
  const { pathname, search } = useLocation();
  const [previewFile, setPreviewFile] = useState<DriveItem | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageFailed, setNextPageFailed] = useState(false);

  const loadMore = async (goal: LoadGoal | null) => {
    if (loadingMore) return files;
    setLoadingMore(true);
    try {
      return await onLoadMore(goal);
    } finally {
      setLoadingMore(false);
    }
  };

  const showPreview = (file: DriveItem | null) => {
    setNextPageFailed(false);
    setPreviewFile(file);
  };

  const previewFromNextPage = async (from: DriveItem) => {
    setNextPageFailed(false);
    const loaded = await loadMore((listed) => pdfAfter(listed, from) !== null);
    if (loaded === null) {
      setNextPageFailed(true);
      return;
    }
    const nextPdf = pdfAfter(loaded, from);
    if (nextPdf) setPreviewFile((current) => (current?.id === from.id ? nextPdf : current));
  };

  if (loading) {
    return (
      <>
        <BreadcrumbNav pathname={pathname} search={search} />
        <Group justify="center" className={classes.loading}>
          <Loader size="lg" type="dots" />
        </Group>
      </>
    );
  }

  return (
    <>
      <BreadcrumbNav pathname={pathname} search={search} />
      <Box>
        {files.length === 0 && !failed && <EmptyState message={emptyMessage} />}
        {files.length > 0 && (
          <Stack gap="xs">
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                folderOpener={folderOpener}
                onPreview={showPreview}
              />
            ))}
          </Stack>
        )}
        {failed && files.length > 0 && (
          <Box mt="md">
            <ErrorAlert message={errorMessage} />
          </Box>
        )}
        {hasMore && (
          <Group justify="center" mt="md" className={classes.loadMoreRow}>
            <Button
              variant="light"
              loading={loadingMore}
              loaderProps={{ size: 'xs', type: 'dots' }}
              className={clsx(buttonClasses.primary, classes.loadMore)}
              onClick={() => void loadMore(null)}
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
          files={files.filter(isPdf)}
          onSelect={showPreview}
          onNextPage={hasMore ? () => void previewFromNextPage(previewFile) : null}
          loadingNextPage={loadingMore}
          nextPageFailed={nextPageFailed}
          onClose={() => showPreview(null)}
        />
      )}
    </>
  );
}
