import { ActionIcon, Box, Text } from '@mantine/core';
import { useTimeout } from '@mantine/hooks';
import { clsx } from 'clsx';
import { useState } from 'react';

import { PDF_MIME_TYPE, isFolder, type DriveItem } from '../../shared/drive.ts';
import { downloadHref } from '../api/drive.ts';
import {
  IconDownload,
  IconEye,
  IconFile,
  IconFolder,
  IconMusic,
  IconPhoto,
  IconPlayerPlay,
} from '../icons.ts';
import { formatFileSize } from '../lib/format.ts';

import classes from './FileRow.module.css';

const DOWNLOAD_FEEDBACK_MS = 500;

function FileIcon({ file }: { file: DriveItem }) {
  if (isFolder(file)) return <IconFolder size={20} />;
  const mimeType = file.mimeType.toLowerCase();
  if (mimeType.includes('video')) return <IconPlayerPlay size={20} />;
  if (mimeType.includes('image')) return <IconPhoto size={20} />;
  if (mimeType.includes('audio')) return <IconMusic size={20} />;
  return <IconFile size={20} />;
}

type FileRowProps = {
  file: DriveItem;
  onOpenFolder: (folder: DriveItem) => void;
  onPreview: (file: DriveItem) => void;
};

export function FileRow({ file, onOpenFolder, onPreview }: FileRowProps) {
  const [downloading, setDownloading] = useState(false);
  const downloadFeedback = useTimeout(() => setDownloading(false), DOWNLOAD_FEEDBACK_MS);
  const folder = isFolder(file);

  const download = () => {
    setDownloading(true);
    window.open(downloadHref(file.id), '_blank');
    downloadFeedback.start();
  };

  return (
    <Box className={classes.row}>
      <Box className={classes.content}>
        <Box className={classes.details}>
          <Box className={classes.icon}>
            <FileIcon file={file} />
          </Box>
          <Box className={classes.names}>
            {folder ? (
              <Text
                component="button"
                type="button"
                truncate
                className={clsx(classes.name, classes.folderName)}
                onClick={() => onOpenFolder(file)}
              >
                {file.name}
              </Text>
            ) : (
              <>
                <Text size="md" fw={500} truncate className={clsx(classes.name, classes.fileName)}>
                  {file.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {file.size ? formatFileSize(file.size) : ''}
                </Text>
              </>
            )}
          </Box>
        </Box>

        {!folder && (
          <Box className={classes.actions}>
            {file.mimeType === PDF_MIME_TYPE && (
              <ActionIcon
                variant="subtle"
                size="lg"
                title="Preview"
                className={classes.previewButton}
                onClick={() => onPreview(file)}
              >
                <IconEye size={18} />
              </ActionIcon>
            )}
            <ActionIcon
              variant="subtle"
              size="lg"
              title="Download"
              disabled={downloading}
              className={clsx(classes.downloadButton, downloading && classes.downloading)}
              onClick={download}
            >
              <IconDownload size={18} />
            </ActionIcon>
          </Box>
        )}
      </Box>
    </Box>
  );
}
