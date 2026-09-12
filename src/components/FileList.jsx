import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Group, Text, Button, Box, Loader, Stack, ThemeIcon, ActionIcon, rgba } from '@mantine/core';
import { IconFolder, IconFile, IconPlayerPlay, IconPhoto, IconMusic, IconDownload, IconInbox, IconEye } from '@tabler/icons-react';
import { useStyles } from './FileList.styles';
import { useLocation } from 'react-router-dom';
import { BreadcrumbNav } from './BreadcrumbNav';
import FilePreview from './FilePreview';

function EmptyState() {
  return (
    <Stack align="center" gap="xs" py={50}>
      <ThemeIcon 
        size={80} 
        radius={100}
        variant="light"
        sx={(theme) => ({
          backgroundColor: rgba(theme.colors.blue[9], 0.15),
          color: theme.colors.blue[4],
        })}
      >
        <IconInbox size={40} />
      </ThemeIcon>
      <Text size="xl" fw={500}>Looks rather empty here</Text>
      <Text size="sm" c="dimmed" ta="center" px="lg">
        Much like a professor&apos;s office during exam week, this folder appears to be vacant.
      </Text>
    </Stack>
  );
}

export function FileList({ files, loading, onLoadMore, hasMore, onFolderClick }) {
  const { classes } = useStyles();
  const [previewFile, setPreviewFile] = useState(null);
  const location = useLocation();
  const [, setIsMobile] = useState(window.innerWidth <= 600);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  };

  const pathSegments = location.pathname.split('/').filter(Boolean);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = async (file) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(file.id));
      const response = await fetch(`/api/download?fileId=${file.id}&directLink=true`);
      const metadata = await response.json();
      
      window.open(metadata.downloadUrl, '_blank');
      
      setTimeout(() => {
        setDownloadingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.id);
          return newSet;
        });
      }, 500);
    } catch (error) {
      console.error('Error getting download URL:', error);
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
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
        <Group justify="center" style={{ minHeight: 200 }}>
          <Loader size="lg" type="dots" />
        </Group>
      </>
    );
  }

  return (
    <>
      <BreadcrumbNav pathSegments={pathSegments} />
      <Box>
        {files.length === 0 ? (
          <Box className={classes.emptyStateWrapper}>
            <EmptyState />
          </Box>
        ) : (
          <Stack gap="xs">
            {files.map((file) => (
              <Box
                key={file.id}
                sx={(theme) => ({
                  background: theme.colors.dark[7],
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.dark[5]}`,
                  boxShadow: theme.shadows.xs,
                  padding: theme.spacing.md,
                })}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <Box sx={{ flexShrink: 0 }}>
                      {getFileIcon(file)}
                    </Box>
                    
                    <Box sx={{ 
                      minWidth: 0, 
                      flex: 1, 
                      overflow: 'hidden'
                    }}>
                      {file.mimeType === 'application/vnd.google-apps.folder' ? (
                        <Text
                          className={classes.link}
                          onClick={() => onFolderClick(file)}
                          truncate
                        >
                          {file.name}
                        </Text>
                      ) : (
                        <Text className={classes.fileName} size="md" fw={500} truncate>{file.name}</Text>
                      )}
                      {file.mimeType !== 'application/vnd.google-apps.folder' && (
                        <Text size="xs" c="dimmed">{file.size ? formatFileSize(file.size) : ''}</Text>
                      )}
                    </Box>
                  </Box>
                  
                  {file.mimeType !== 'application/vnd.google-apps.folder' && (
                    <Box sx={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {file.mimeType === 'application/pdf' && (
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handlePreview(file)}
                          size="lg"
                          title="Preview"
                          sx={(theme) => ({
                            color: theme.colors.gray[4],
                            backgroundColor: rgba(theme.colors.gray[8], 0.15),
                          })}
                        >
                          <IconEye size={18} />
                        </ActionIcon>
                      )}
                      <ActionIcon
                        variant="subtle"
                        onClick={() => handleDownload(file)}
                        size="lg"
                        disabled={downloadingIds.has(file.id)}
                        title="Download"
                        sx={(theme) => ({
                          color: '#228be6',
                          backgroundColor: rgba(theme.colors.gray[8], 0.15),
                          transform: downloadingIds.has(file.id) ? 'scale(0.95)' : 'scale(1)',
                          transition: 'transform 0.2s ease',
                          opacity: downloadingIds.has(file.id) ? 0.8 : 1,
                        })}
                      >
                        <IconDownload size={18} />
                      </ActionIcon>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
        {hasMore && (
          <Group justify="center" mt="md" style={{ minHeight: 36 }}>
            <Button
              onClick={handleLoadMore}
              loading={loadingMore}
              loaderProps={{ size: 'xs', type: 'dots' }}
              variant="light"
              styles={{ root: { minWidth: 140 } }}
            >
              Load More
            </Button>
          </Group>
        )}
      </Box>

      <FilePreview
        key={previewFile?.id}
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