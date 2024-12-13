import React from 'react';
import { Table, Group, Text, Button, Box, Loader, Breadcrumbs, Anchor, Paper } from '@mantine/core';
import { IconFolder, IconFile, IconPlayerPlay, IconPhoto, IconMusic, IconDownload, IconChevronRight } from '@tabler/icons-react';
import { useStyles } from './FileList.styles';
import { useLocation, useNavigate } from 'react-router-dom';

export function FileList({ files, loading, onLoadMore, hasMore, onFolderClick }) {
  const { classes } = useStyles();
  const [downloadingFiles, setDownloadingFiles] = React.useState(new Set());
  const location = useLocation();
  const navigate = useNavigate();

  // Parse current path for breadcrumb
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    return (
      <Anchor
        key={path}
        onClick={(event) => {
          event.preventDefault();
          navigate(path);
        }}
        sx={(theme) => ({
          color: theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6],
          '&:hover': {
            textDecoration: 'underline',
          }
        })}
      >
        {decodeURIComponent(segment)}
      </Anchor>
    );
  });

  // Always add Home to beginning
  breadcrumbItems.unshift(
    <Anchor
      key="home"
      onClick={(event) => {
        event.preventDefault();
        navigate('/');
      }}
      sx={(theme) => ({
        color: theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6],
        '&:hover': {
          textDecoration: 'underline',
        }
      })}
    >
      Home
    </Anchor>
  );

  const handleDownload = async (file) => {
    if (downloadingFiles.has(file.id)) return;

    try {
      setDownloadingFiles(prev => new Set([...prev, file.id]));
      
      // Get the file blob using the downloadUrl function
      const blob = await file.downloadUrl();
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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

  const renderBreadcrumb = () => (
    <Paper 
      shadow="xs" 
      p="md" 
      mb="md"
      sx={(theme) => ({
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
      })}
    >
      <Breadcrumbs 
        separator={
          <IconChevronRight 
            size={16} 
            style={{ 
              marginTop: 4,
              color: 'var(--mantine-color-gray-5)'
            }} 
          />
        }
      >
        {breadcrumbItems}
      </Breadcrumbs>
    </Paper>
  );

  // Show loading state
  if (loading) {
    return (
      <>
        {renderBreadcrumb()}
        <Group position="center" style={{ minHeight: 200 }}>
          <Loader size="lg" variant="dots" />
        </Group>
      </>
    );
  }

  return (
    <>
      {renderBreadcrumb()}
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