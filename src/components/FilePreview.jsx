import PropTypes from 'prop-types';
import { Modal, Box, Group, Text, Loader, ActionIcon, Paper, Stack, Progress } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconX, IconDownload } from '@tabler/icons-react';
import { useHotkeys } from '@mantine/hooks';
import { useState } from 'react';

const FilePreview = ({ 
  opened, 
  onClose, 
  file, 
  onNext, 
  onPrevious,
  loading
}) => {
  const isPdf = file?.mimeType === 'application/pdf';
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useHotkeys([
    ['ArrowRight', onNext],
    ['ArrowLeft', onPrevious],
    ['Escape', onClose],
  ]);

  const handleDownload = async (file) => {
    if (downloading) return;
    try {
      setDownloading(true);
      setDownloadProgress(0);
      const response = await fetch(`/api/stream?fileId=${file.id}`, {
        method: 'GET',
      });
      const reader = response.body.getReader();
      const contentLength = +response.headers.get('Content-Length');
      let receivedLength = 0;
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        setDownloadProgress(Math.round((receivedLength / contentLength) * 100));
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
      console.error('Error downloading file:', error);
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  if (!file) return null;

  // Responsive: Only icons on mobile
  const isMobile = window.innerWidth <= 600;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      fullScreen
      padding={0}
      withCloseButton={false}
      styles={(theme) => ({
        modal: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.white,
        },
        body: {
          padding: 0,
          height: '100%',
        },
      })}
    >
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--mantine-color-body)',
        }}
      >
        {/* Header */}
        <Paper
          p={isMobile ? 'xs' : 'md'}
          sx={(theme) => ({
            borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
            zIndex: 2,
          })}
        >
          <Group position="apart" align="center" spacing={isMobile ? 'xs' : 'md'}>
            <Group spacing={isMobile ? 0 : 'xs'}>
              <ActionIcon
                variant="subtle"
                onClick={onPrevious}
                disabled={!onPrevious}
                size={isMobile ? 'md' : 'lg'}
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                      : theme.fn.rgba(theme.colors.gray[0], 0.5),
                  }
                })}
              >
                <IconChevronLeft size={isMobile ? 18 : 20} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                onClick={onNext}
                disabled={!onNext}
                size={isMobile ? 'md' : 'lg'}
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                      : theme.fn.rgba(theme.colors.gray[0], 0.5),
                  }
                })}
              >
                <IconChevronRight size={isMobile ? 18 : 20} />
              </ActionIcon>
            </Group>
            {!isMobile && (
              <Stack spacing={0} sx={{ minWidth: 0, flex: 1 }}>
                <Text size="lg" weight={500} truncate>
                  {file.name}
                </Text>
                <Text size="sm" color="dimmed" truncate>
                  {file.mimeType}
                </Text>
              </Stack>
            )}
            <Group spacing={isMobile ? 0 : 'xs'}>
              <ActionIcon
                variant="subtle"
                size={isMobile ? 'md' : 'lg'}
                onClick={() => handleDownload(file)}
                loading={downloading}
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.cyan[4] : theme.colors.cyan[7],
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.fn.rgba(theme.colors.cyan[8], 0.15)
                      : theme.fn.rgba(theme.colors.cyan[0], 0.15),
                  }
                })}
              >
                <IconDownload size={isMobile ? 18 : 20} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size={isMobile ? 'md' : 'lg'}
                onClick={onClose}
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.red[4] : theme.colors.red[7],
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.fn.rgba(theme.colors.red[8], 0.15)
                      : theme.fn.rgba(theme.colors.red[0], 0.15),
                  }
                })}
              >
                <IconX size={isMobile ? 18 : 20} />
              </ActionIcon>
            </Group>
          </Group>
          {downloading && (
            <Progress
              value={downloadProgress}
              size={isMobile ? 'sm' : 'md'}
              radius="xl"
              mt={isMobile ? 4 : 8}
              styles={{
                bar: {
                  background: 'linear-gradient(90deg, #00ffea 0%, #00ff6a 100%)',
                  transition: 'width 200ms ease',
                },
                root: {
                  background: 'rgba(0,255,234,0.08)',
                  boxShadow: '0 0 4px #00ffea, 0 0 8px #00ff6a',
                },
              }}
            />
          )}
        </Paper>
        {/* Content */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'var(--mantine-color-body)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 16,
          }}
        >
          {loading ? (
            <Group position="center" h="100%">
              <Loader size="lg" />
            </Group>
          ) : isPdf ? (
            <iframe
              src={`/api/stream?fileId=${file.id}&inline=true`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                minHeight: isMobile ? '100vh' : 500,
                minWidth: isMobile ? '100vw' : 0,
                background: 'white',
              }}
              title={file.name}
            />
          ) : (
            <Group position="center" h="100%">
              <Stack align="center" spacing="xs">
                <Text size="xl" color="dimmed">Preview not available</Text>
                <Text size="sm" color="dimmed">This file type cannot be previewed</Text>
              </Stack>
            </Group>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

FilePreview.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  file: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    mimeType: PropTypes.string.isRequired,
  }),
  onNext: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  files: PropTypes.array,
};

export default FilePreview; 