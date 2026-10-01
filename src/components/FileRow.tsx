import { ActionIcon, Box, Text } from '@mantine/core';
import { clsx } from 'clsx';
import { Link } from 'react-router';

import { PDF_MIME_TYPE, isFolder, type DriveItem } from '../../shared/drive.ts';
import { useDownload } from '../hooks/useDownload.ts';
import { IconDownload, IconEye } from '../icons.ts';
import { formatFileSize } from '../lib/format.ts';
import { FileIcon } from './FileIcon.tsx';

import downloadClasses from '../styles/download.module.css';
import classes from './FileRow.module.css';

const ACTION_ICON_SIZE = 18;

export type FolderOpener =
  | { href: (folder: DriveItem) => string }
  | { onOpen: (folder: DriveItem) => void };

type FileRowProps = {
  file: DriveItem;
  folderOpener: FolderOpener;
  onPreview: (file: DriveItem) => void;
};

export function FileRow({ file, folderOpener, onPreview }: FileRowProps) {
  const { downloading, download } = useDownload(file.id);
  const folder = isFolder(file);

  return (
    <Box className={classes.row}>
      <Box className={classes.content}>
        <Box className={classes.details}>
          <Box className={classes.icon}>
            <FileIcon file={file} />
          </Box>
          <Box className={classes.names}>
            {folder ? (
              'href' in folderOpener ? (
                <Text
                  component={Link}
                  to={folderOpener.href(file)}
                  truncate
                  className={clsx(classes.name, classes.folderName)}
                >
                  {file.name}
                </Text>
              ) : (
                <Text
                  component="button"
                  type="button"
                  truncate
                  className={clsx(classes.name, classes.folderName)}
                  onClick={() => folderOpener.onOpen(file)}
                >
                  {file.name}
                </Text>
              )
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
                <IconEye size={ACTION_ICON_SIZE} />
              </ActionIcon>
            )}
            <ActionIcon
              variant="subtle"
              size="lg"
              title="Download"
              disabled={downloading}
              className={clsx(classes.downloadButton, downloading && downloadClasses.downloading)}
              onClick={download}
            >
              <IconDownload size={ACTION_ICON_SIZE} />
            </ActionIcon>
          </Box>
        )}
      </Box>
    </Box>
  );
}
