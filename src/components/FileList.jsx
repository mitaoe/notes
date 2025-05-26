import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Group, Text, Button, Box, Loader, Stack, ThemeIcon, Progress, ActionIcon } from '@mantine/core';
import { IconFolder, IconFile, IconPlayerPlay, IconPhoto, IconMusic, IconDownload, IconInbox, IconEye, IconX } from '@tabler/icons-react';
import { useStyles } from './FileList.styles';
import { useLocation } from 'react-router-dom';
import { BreadcrumbNav } from './BreadcrumbNav';
import FilePreview from './FilePreview';

function EmptyState() {
  return (
    <Stack align="center" spacing="xs" py={50}>
      <ThemeIcon 
        size={80} 
        radius={100}
        variant="light"
        sx={(theme) => ({
          backgroundColor: theme.colorScheme === 'dark' 
            ? theme.fn.rgba(theme.colors.blue[9], 0.15)
            : theme.fn.rgba(theme.colors.blue[0], 0.5),
          color: theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6],
        })}
      >
        <IconInbox size={40} />
      </ThemeIcon>
      <Text size="xl" weight={500}>Looks rather empty here</Text>
      <Text size="sm" color="dimmed" align="center" px="lg">
        Much like a professor`&apos;`s office during exam week, this folder appears to be vacant.
      </Text>
    </Stack>
  );
}

export function FileList({ files, loading, onLoadMore, hasMore, onFolderClick }) {
  const { classes } = useStyles();
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const [downloadProgress, setDownloadProgress] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const abortControllersRef = useRef({});

  const pathSegments = location.pathname.split('/').filter(Boolean);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = async (file) => {
    if (downloadingFiles.has(file.id)) {
      // Cancel the download
      if (abortControllersRef.current[file.id]) {
        abortControllersRef.current[file.id].abort();
        delete abortControllersRef.current[file.id];
      }
      
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.id];
        return newProgress;
      });
      
      return;
    }

    try {
      const controller = new AbortController();
      abortControllersRef.current[file.id] = controller;
      
      setDownloadingFiles(prev => new Set(prev).add(file.id));
      setDownloadProgress(prev => ({ ...prev, [file.id]: 0 }));

      const response = await fetch(`/api/stream?fileId=${file.id}`, {
        method: 'GET',
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const contentLength = +response.headers.get('Content-Length');
      let receivedLength = 0;

      const chunks = [];
      while(true) {
        const {done, value} = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        setDownloadProgress(prev => ({
          ...prev,
          [file.id]: contentLength ? Math.round((receivedLength / contentLength) * 100) : 0
        }));
      }

      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error downloading file:', error);
      }
    } finally {
      delete abortControllersRef.current[file.id];
      
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.id];
        return newProgress;
      });
    }
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  const handlePreviewClose = () => {
    setPreviewFile(null);
  };

  const handleNextFile = () => {
    const currentIndex = files.findIndex(f => f.id === previewFile.id);
    if (currentIndex < files.length - 1) {
      setPreviewFile(files[currentIndex + 1]);
    }
  };

  const handlePreviousFile = () => {
    const currentIndex = files.findIndex(f => f.id === previewFile.id);
    if (currentIndex > 0) {
      setPreviewFile(files[currentIndex - 1]);
    }
  };

  const getFileIcon = (file) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      return <IconFolder size={20} />;
    }
    
    const mimeType = file.mimeType?.toLowerCase() || '';
    if (mimeType.includes('video')) {
      return <IconPlayerPlay size={20} />;
    }
    if (mimeType.includes('image')) {
      return <IconPhoto size={20} />;
    }
    if (mimeType.includes('audio')) {
      return <IconMusic size={20} />;
    }
    return <IconFile size={20} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <>
        <BreadcrumbNav pathSegments={pathSegments} />
        <Group position="center" style={{ minHeight: 200 }}>
          <Loader size="lg" variant="dots" />
        </Group>
      </>
    );
  }

  return (
    <>
      <BreadcrumbNav pathSegments={pathSegments} />
      <Box className={classes.wrapper}>
        {files.length === 0 ? (
          <Box className={classes.emptyStateWrapper}>
            <EmptyState />
          </Box>
        ) : (
          <Stack spacing="xs">
            {files.map((file) => (
              <Group key={file.id} position="apart" p="md" sx={(theme) => ({
                background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
                borderRadius: theme.radius.sm,
                border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
                boxShadow: theme.shadows.xs,
                alignItems: 'center',
              })}>
                <Group spacing="sm" align="center" sx={{ flex: 1, minWidth: 0 }}>
                  {getFileIcon(file)}
                  <Box sx={{ minWidth: 0 }}>
                    {file.mimeType === 'application/vnd.google-apps.folder' ? (
                      <Text
                        className={classes.link}
                        onClick={() => onFolderClick(file)}
                        sx={{ cursor: 'pointer' }}
                      >
                        {file.name}
                      </Text>
                    ) : (
                      <Text className={classes.fileName} size="md" weight={500} truncate>{file.name}</Text>
                    )}
                    {file.mimeType !== 'application/vnd.google-apps.folder' && (
                      <Text size="xs" color="dimmed">{file.size ? formatFileSize(file.size) : ''}</Text>
                    )}
                  </Box>
                </Group>
                {file.mimeType !== 'application/vnd.google-apps.folder' && (
                  <Group spacing="sm" direction="row" align="center">
                    {file.mimeType === 'application/pdf' && !isMobile && (
                      <ActionIcon
                        variant="subtle"
                        onClick={() => handlePreview(file)}
                        size="lg"
                        title="Preview"
                        sx={(theme) => ({
                          color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                          backgroundColor: theme.colorScheme === 'dark' 
                            ? theme.fn.rgba(theme.colors.gray[8], 0.15)
                            : theme.fn.rgba(theme.colors.gray[0], 0.15),
                        })}
                      >
                        <IconEye size={18} />
                      </ActionIcon>
                    )}
                    <Box>
                      <ActionIcon
                        variant="subtle"
                        onClick={() => handleDownload(file)}
                        size="lg"
                        title={downloadingFiles.has(file.id) ? "Cancel Download" : "Download"}
                        sx={(theme) => ({
                          color: downloadingFiles.has(file.id)
                            ? (theme.colorScheme === 'dark' ? theme.colors.red[4] : theme.colors.red[7])
                            : (theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[7]),
                          backgroundColor: theme.colorScheme === 'dark' 
                            ? theme.fn.rgba(theme.colors.gray[8], 0.15)
                            : theme.fn.rgba(theme.colors.gray[0], 0.15),
                        })}
                      >
                        {downloadingFiles.has(file.id) ? (
                          <IconX size={18} />
                        ) : (
                          <IconDownload size={18} />
                        )}
                      </ActionIcon>
                      {downloadingFiles.has(file.id) && downloadProgress[file.id] > 0 && (
                        <Progress 
                          value={downloadProgress[file.id]} 
                          size="xs" 
                          mt={4}
                          styles={(theme) => ({
                            bar: {
                              transition: 'width 200ms ease',
                              backgroundColor: theme.colorScheme === 'dark' 
                                ? theme.colors.blue[4] 
                                : theme.colors.blue[6],
                            },
                            root: {
                              backgroundColor: theme.colorScheme === 'dark'
                                ? theme.fn.rgba(theme.colors.blue[9], 0.15)
                                : theme.fn.rgba(theme.colors.blue[0], 0.5),
                            }
                          })}
                        />
                      )}
                    </Box>
                  </Group>
                )}
              </Group>
            ))}
          </Stack>
        )}
        {hasMore && (
          <Group position="center" mt="md">
            <Button onClick={onLoadMore} variant="light">
              Load More
            </Button>
          </Group>
        )}
      </Box>

      <FilePreview
        opened={!!previewFile}
        onClose={handlePreviewClose}
        file={previewFile}
        files={files.filter(f => f.mimeType === 'application/pdf')}
        onNext={handleNextFile}
        onPrevious={handlePreviousFile}
        loading={false}
      />
    </>
  );
}

FileList.propTypes = {
  files: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    mimeType: PropTypes.string.isRequired,
    size: PropTypes.number,
  })).isRequired,
  loading: PropTypes.bool.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  hasMore: PropTypes.bool.isRequired,
  onFolderClick: PropTypes.func.isRequired,
}; 