import PropTypes from 'prop-types';
import { Modal, Box, Group, Text, ActionIcon, Paper, Stack } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconX, IconDownload } from '@tabler/icons-react';
import { useHotkeys } from '@mantine/hooks';
import { useState, useEffect } from 'react';

const FilePreview = ({ 
  opened, 
  onClose, 
  file, 
  onNext, 
  onPrevious,
  files
}) => {
  const isPdf = file?.mimeType === 'application/pdf';
  const [downloading, setDownloading] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useHotkeys([
    ['ArrowRight', onNext],
    ['ArrowLeft', onPrevious],
    ['Escape', onClose],
  ]);

  const handleDownload = async (file) => {
    if (downloading) return;
    try {
      setDownloading(true);
      const response = await fetch(`/api/stream?fileId=${file.id}`, {
        method: 'GET',
      });
      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
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
    }
  };

  useEffect(() => { setIframeLoaded(false); }, [file?.id]);

  if (!file) return null;

  // Responsive: Only icons on mobile
  const isMobile = window.innerWidth <= 600;

  // Only allow navigation between previewable files (PDFs)
  const previewableFiles = files?.filter(f => f.mimeType === 'application/pdf') || [];
  const currentIndex = previewableFiles.findIndex(f => f.id === file?.id);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < previewableFiles.length - 1;

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
                onClick={canGoPrevious ? () => onPrevious(previewableFiles[currentIndex - 1]) : undefined}
                disabled={!canGoPrevious}
                size={isMobile ? 'md' : 'lg'}
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  backgroundColor: canGoPrevious ? undefined : theme.fn.rgba(theme.colors.gray[8], 0.15),
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
                onClick={canGoNext ? () => onNext(previewableFiles[currentIndex + 1]) : undefined}
                disabled={!canGoNext}
                size={isMobile ? 'md' : 'lg'}
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  backgroundColor: canGoNext ? undefined : theme.fn.rgba(theme.colors.gray[8], 0.15),
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
            <Stack spacing={0} sx={{ minWidth: 0, flex: 1, maxWidth: isMobile ? '60vw' : '100vw' }}>
              <Text size={isMobile ? 'md' : 'lg'} weight={500} truncate={false} sx={{ wordBreak: 'break-all', textAlign: 'center' }}>
                {file.name}
              </Text>
              {!isMobile && (
                <Text size="sm" color="dimmed" truncate>
                  {file.mimeType}
                </Text>
              )}
            </Stack>
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
        </Paper>
        {/* Content */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#181A1B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 16,
          }}
        >
          {isPdf ? (
            <>
              {!iframeLoaded && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  pointerEvents: 'none',
                }}>
                  <Text size="md" color="#fff" sx={{ opacity: 0.8, fontWeight: 500, letterSpacing: 1 }}>Loading PDF…</Text>
                </Box>
              )}
              <iframe
                key={file.id}
                src={`/api/stream?fileId=${file.id}&inline=true`}
                style={{
                  width: isMobile ? '100vw' : '100%',
                  height: isMobile ? '100vh' : '100%',
                  border: 'none',
                  background: 'transparent',
                  paddingTop: isMobile ? 24 : 0,
                  zIndex: 2,
                }}
                title={file.name}
                onLoad={() => setIframeLoaded(true)}
              />
            </>
          ) : (
            <Group position="center" h="100%">
              <Stack align="center" spacing="xs">
                <Text size="xl" color="#fff" sx={{ opacity: 0.8 }}>Preview not available</Text>
                <Text size="sm" color="#fff" sx={{ opacity: 0.7 }}>This file type cannot be previewed</Text>
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
  files: PropTypes.array,
};

export default FilePreview; 