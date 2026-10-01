import { ActionIcon, Box, Button, Group, Modal, Paper, Stack, Text } from '@mantine/core';
import { useHotkeys, useMediaQuery } from '@mantine/hooks';
import { clsx } from 'clsx';
import { useState, type SyntheticEvent } from 'react';

import { FILE_LINK_ERROR_TITLE, type DriveItem } from '../../shared/drive.ts';
import { previewHref } from '../api/drive.ts';
import { useDownload } from '../hooks/useDownload.ts';
import { IconChevronLeft, IconChevronRight, IconDownload, IconX } from '../icons.ts';
import { ErrorAlert } from './ErrorAlert.tsx';

import downloadClasses from '../styles/download.module.css';
import classes from './FilePreview.module.css';

const COMPACT_QUERY = '(max-width: 600px)';
const NEXT_PAGE_FAILED = "Couldn't load more files. Please try again.";
const FRAME_SANDBOX = [
  'allow-scripts',
  'allow-same-origin',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-downloads',
  'allow-modals',
  'allow-forms',
].join(' ');

type FrameState = 'loading' | 'loaded' | 'failed';

const frameStateAfterLoad = (event: SyntheticEvent<HTMLIFrameElement>): FrameState =>
  event.currentTarget.contentDocument?.title === FILE_LINK_ERROR_TITLE ? 'failed' : 'loaded';

type FilePreviewProps = {
  file: DriveItem;
  files: DriveItem[];
  onSelect: (file: DriveItem) => void;
  onNextPage: (() => void) | null;
  loadingNextPage: boolean;
  nextPageFailed: boolean;
  onClose: () => void;
};

export function FilePreview({
  file,
  files,
  onSelect,
  onNextPage,
  loadingNextPage,
  nextPageFailed,
  onClose,
}: FilePreviewProps) {
  const compact = useMediaQuery(COMPACT_QUERY, false, { getInitialValueInEffect: false });
  const [frameState, setFrameState] = useState<FrameState>('loading');
  const { downloading, download } = useDownload(file.id);

  const index = files.findIndex((candidate) => candidate.id === file.id);
  const previous = index > 0 ? (files[index - 1] ?? null) : null;
  const next = index >= 0 ? (files[index + 1] ?? null) : null;

  const showPrevious = () => previous && onSelect(previous);
  const showNext = () => {
    if (next) onSelect(next);
    else if (!loadingNextPage) onNextPage?.();
  };

  useHotkeys([
    ['ArrowRight', showNext],
    ['ArrowLeft', showPrevious],
  ]);

  const iconSize = compact ? 16 : 18;
  const chevronSize = compact ? 16 : 20;

  return (
    <Modal.Root
      opened
      onClose={onClose}
      size="xl"
      fullScreen
      padding={0}
      classNames={{ body: classes.body }}
    >
      <Modal.Overlay />
      <Modal.Content aria-label={`Preview of ${file.name}`}>
        <Modal.Body>
          <Box className={classes.container}>
            <Paper p="md" className={classes.toolbar}>
              <Box className={classes.toolbarContent}>
                <Button
                  variant="subtle"
                  size={compact ? 'xs' : 'sm'}
                  radius="md"
                  leftSection={<IconX size={iconSize} />}
                  aria-label="Close preview"
                  className={clsx(classes.actionButton, classes.closeButton)}
                  onClick={onClose}
                >
                  {compact ? '' : 'Close'}
                </Button>

                <Box className={classes.titleArea}>
                  <Box className={classes.titleBar}>
                    <ActionIcon
                      variant="subtle"
                      size={compact ? 'md' : 'lg'}
                      disabled={previous === null}
                      aria-label="Previous file"
                      className={clsx(classes.navButton, classes.previous)}
                      onClick={showPrevious}
                    >
                      <IconChevronLeft size={chevronSize} />
                    </ActionIcon>

                    <Text size={compact ? 'sm' : 'md'} fw={500} className={classes.fileName}>
                      {file.name}
                    </Text>

                    <ActionIcon
                      variant="subtle"
                      size={compact ? 'md' : 'lg'}
                      disabled={next === null && onNextPage === null}
                      loading={next === null && loadingNextPage}
                      aria-label="Next file"
                      className={clsx(classes.navButton, classes.next)}
                      onClick={showNext}
                    >
                      <IconChevronRight size={chevronSize} />
                    </ActionIcon>
                  </Box>
                </Box>

                <Button
                  variant="subtle"
                  size={compact ? 'xs' : 'sm'}
                  radius="md"
                  leftSection={<IconDownload size={iconSize} />}
                  disabled={downloading}
                  aria-label="Download file"
                  className={clsx(
                    classes.actionButton,
                    classes.downloadButton,
                    downloading && downloadClasses.downloading,
                  )}
                  onClick={download}
                >
                  {compact ? '' : 'Download'}
                </Button>
              </Box>
            </Paper>

            <Box className={classes.viewer}>
              {nextPageFailed && (
                <Box className={classes.nextPageFailed}>
                  <ErrorAlert message={NEXT_PAGE_FAILED} />
                </Box>
              )}
              {frameState === 'loading' && (
                <Box className={classes.loadingOverlay}>
                  <Text size="md" c="white" className={classes.loadingText}>
                    Loading PDF…
                  </Text>
                </Box>
              )}
              {frameState === 'failed' ? (
                <Group justify="center" h="100%">
                  <Stack align="center" gap="xs">
                    <Text size="xl" c="white" className={classes.unavailableTitle}>
                      Preview not available
                    </Text>
                    <Text size="sm" c="white" className={classes.unavailableDetail}>
                      This file could not be loaded
                    </Text>
                  </Stack>
                </Group>
              ) : (
                <iframe
                  src={previewHref(file.id)}
                  title={file.name}
                  sandbox={FRAME_SANDBOX}
                  className={classes.frame}
                  onLoad={(event) => setFrameState(frameStateAfterLoad(event))}
                />
              )}
            </Box>
          </Box>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
