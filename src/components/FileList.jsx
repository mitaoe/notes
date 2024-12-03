import React from 'react';
import { Table, Group, Text, ActionIcon, Loader, Button, createStyles, Box } from '@mantine/core';
import { IconFolder, IconFile, IconDownload, IconPlayerPlay, IconPhoto, IconMusic } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { getDownloadLink } from '../services/driveService';
import { uiConfig } from '../config';

const useStyles = createStyles((theme) => ({
  wrapper: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
    minWidth: '100%',
    '@media (max-width: 768px)': {
      '& th, & td': {
        padding: '8px',
      },
    },
  },
  header: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
  },
  row: {
    borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
    '&:last-of-type': {
      borderBottom: 'none',
    },
  },
  icon: {
    color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6],
  },
  link: {
    color: theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6],
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  actionIcon: {
    color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6],
    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
    },
  },
  mobileHide: {
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  fileName: {
    wordBreak: 'break-word',
    '@media (max-width: 768px)': {
      maxWidth: '200px',
    },
  },
}));

function formatFileSize(bytes) {
  if (!bytes) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FileList({ files, loading, onLoadMore, hasMore }) {
  const { classes } = useStyles();
  const [downloadingFiles, setDownloadingFiles] = React.useState(new Set());

  const handleDownload = async (fileId, fileName) => {
    if (downloadingFiles.has(fileId)) return;

    try {
      setDownloadingFiles(prev => new Set([...prev, fileId]));
      const downloadUrl = await getDownloadLink(fileId);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      
      // Start the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
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
              <th className={classes.header} style={{ width: '60%' }}>Name</th>
              {uiConfig.display_size && (
                <th className={`${classes.header} ${classes.mobileHide}`} style={{ width: '15%' }}>Size</th>
              )}
              {uiConfig.display_time && (
                <th className={`${classes.header} ${classes.mobileHide}`} style={{ width: '15%' }}>Modified</th>
              )}
              {uiConfig.display_download && (
                <th className={classes.header} style={{ width: '10%' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {files?.map((file) => (
              <tr key={file.id} className={classes.row}>
                <td>
                  <Group spacing="sm" noWrap>
                    {getFileIcon(file)}
                    {file.mimeType === 'application/vnd.google-apps.folder' ? (
                      <Link to={`/folder/${file.id}`} className={classes.link}>
                        <Text className={classes.fileName}>{file.name}</Text>
                      </Link>
                    ) : (
                      <Text className={classes.fileName}>{file.name}</Text>
                    )}
                  </Group>
                </td>
                {uiConfig.display_size && (
                  <td className={classes.mobileHide}>
                    {file.mimeType === 'application/vnd.google-apps.folder' ? '-' : formatFileSize(file.size)}
                  </td>
                )}
                {uiConfig.display_time && (
                  <td className={classes.mobileHide}>{formatDate(file.modifiedTime)}</td>
                )}
                {uiConfig.display_download && (
                  <td>
                    <Group spacing="xs" noWrap>
                      {file.mimeType !== 'application/vnd.google-apps.folder' && (
                        <>
                          <ActionIcon 
                            onClick={() => handleDownload(file.id, file.name)}
                            className={classes.actionIcon}
                            loading={downloadingFiles.has(file.id)}
                            disabled={downloadingFiles.has(file.id)}
                          >
                            <IconDownload size={18} />
                          </ActionIcon>
                          {file.mimeType.startsWith('video/') && !uiConfig.disable_player && (
                            <ActionIcon 
                              component={Link} 
                              to={`/view/${file.id}`}
                              className={classes.actionIcon}
                            >
                              <IconPlayerPlay size={18} />
                            </ActionIcon>
                          )}
                        </>
                      )}
                    </Group>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </Box>
      {hasMore && (
        <Group position="center" mt="xl">
          <Button 
            onClick={onLoadMore} 
            variant="light"
            size="md"
            style={{
              backgroundColor: uiConfig.header_style_class.includes('bg-primary') ? '#1a73e8' : '#343a40',
              color: 'white',
            }}
          >
            Load More
          </Button>
        </Group>
      )}
    </>
  );
} 