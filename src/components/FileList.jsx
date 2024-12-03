import React from 'react';
import { Table, Group, Text, Button, Box, Loader } from '@mantine/core';
import { IconFolder, IconFile, IconPlayerPlay, IconPhoto, IconMusic, IconDownload } from '@tabler/icons-react';
import { useStyles } from './FileList.styles';

export function FileList({ files, loading, onLoadMore, hasMore, onFolderClick }) {
  const { classes } = useStyles();
  const [downloadingFiles, setDownloadingFiles] = React.useState(new Set());

  const handleDownload = async (file) => {
    if (downloadingFiles.has(file.id)) return;

    try {
      setDownloadingFiles(prev => new Set([...prev, file.id]));
      
      // Use the direct download link from the file object
      const link = document.createElement('a');
      link.href = file.link;
      link.download = file.name;
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const getFileIcon = (file) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      return <IconFolder size={20} className={classes.icon} />;
    }

    if (file.mimeType.startsWith('video/')) {
      return <IconPlayerPlay size={20} className={classes.icon} />;
    }

    if (file.mimeType.startsWith('image/')) {
      return <IconPhoto size={20} className={classes.icon} />;
    }

    if (file.mimeType.startsWith('audio/')) {
      return <IconMusic size={20} className={classes.icon} />;
    }

    return <IconFile size={20} className={classes.icon} />;
  };

  if (loading && (!files || files.length === 0)) {
    return (
      <Group position="center" style={{ minHeight: 200 }}>
        <Loader size="lg" variant="dots" />
      </Group>
    );
  }

  return (
    <>
      <Box className={classes.wrapper}>
        <Table className={classes.table} verticalSpacing="sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>
                  <Group spacing="sm">
                    {getFileIcon(file)}
                    {file.mimeType === 'application/vnd.google-apps.folder' ? (
                      <Text
                        className={classes.link}
                        onClick={() => onFolderClick(file)}
                      >
                        {file.name}
                      </Text>
                    ) : (
                      <Text>{file.name}</Text>
                    )}
                  </Group>
                </td>
                <td>
                  <Text size="sm" color="dimmed">
                    {file.size ? formatFileSize(file.size) : '-'}
                  </Text>
                </td>
                <td>
                  {file.mimeType !== 'application/vnd.google-apps.folder' && (
                    <Button
                      compact
                      variant="light"
                      rightIcon={<IconDownload size={16} />}
                      onClick={() => handleDownload(file)}
                      loading={downloadingFiles.has(file.id)}
                    >
                      Download
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Box>
      {hasMore && (
        <Group position="center" mt="md">
          <Button onClick={onLoadMore} variant="light">
            Load More
          </Button>
        </Group>
      )}
    </>
  );
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
} 