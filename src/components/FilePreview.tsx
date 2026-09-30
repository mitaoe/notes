import { ActionIcon, Box, Button, Modal, Paper, Text } from '@mantine/core';
import { useHotkeys, useMediaQuery, useTimeout } from '@mantine/hooks';
import { IconChevronLeft, IconChevronRight, IconDownload, IconX } from '../icons.ts';
import { clsx } from 'clsx';
import { useState } from 'react';
import type { DriveItem } from '../../shared/drive.ts';
import { downloadHref, previewHref } from '../api/drive.ts';
import classes from './FilePreview.module.css';

const DOWNLOAD_FEEDBACK_MS = 500;
const COMPACT_QUERY = '(max-width: 600px)';

type FilePreviewProps = {
  file: DriveItem;
  files: DriveItem[];
  onSelect: (file: DriveItem) => void;
  onClose: () => void;
};

export function FilePreview({ file, files, onSelect, onClose }: FilePreviewProps) {
  const compact = useMediaQuery(COMPACT_QUERY, false, { getInitialValueInEffect: false });
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadFeedback = useTimeout(() => setDownloading(false), DOWNLOAD_FEEDBACK_MS);

  const index = files.findIndex((candidate) => candidate.id === file.id);
  const previous = index > 0 ? (files[index - 1] ?? null) : null;
  const next = index >= 0 ? (files[index + 1] ?? null) : null;

  const showPrevious = () => previous && onSelect(previous);
  const showNext = () => next && onSelect(next);

  useHotkeys([
    ['ArrowRight', showNext],
    ['ArrowLeft', showPrevious],
    ['Escape', onClose],
  ]);

  const download = () => {
    setDownloading(true);
    window.open(downloadHref(file.id), '_blank');
    downloadFeedback.start();
  };

  const iconSize = compact ? 16 : 18;
  const chevronSize = compact ? 16 : 20;

  return (
    <Modal opened onClose={onClose} size="xl" fullScreen padding={0} withCloseButton={false} classNames={{ body: classes.body }}>
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
                  disabled={next === null}
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
              className={clsx(classes.actionButton, classes.downloadButton, downloading && classes.downloading)}
              onClick={download}
            >
              {compact ? '' : 'Download'}
            </Button>
          </Box>
        </Paper>

        <Box className={classes.viewer}>
          {!frameLoaded && (
            <Box className={classes.loadingOverlay}>
              <Text size="md" c="#fff" className={classes.loadingText}>
                Loading PDF…
              </Text>
            </Box>
          )}
          <iframe
            src={previewHref(file.id)}
            title={file.name}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-forms"
            className={classes.frame}
            onLoad={() => setFrameLoaded(true)}
          />
        </Box>
      </Box>
    </Modal>
  );
}
