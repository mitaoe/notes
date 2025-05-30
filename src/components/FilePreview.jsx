import PropTypes from 'prop-types';
import { Modal, Box, Group, Text, ActionIcon, Paper, Stack, Button } from '@mantine/core';
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
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useHotkeys([
    ['ArrowRight', onNext],
    ['ArrowLeft', onPrevious],
    ['Escape', onClose],
  ]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = async (file) => {
    try {
      setIsDownloading(true);
      // Request file metadata with direct links
      const response = await fetch(`/api/stream?fileId=${file.id}&directLink=true`);
      const metadata = await response.json();
      
      // Open the direct download URL in a new tab
      window.open(metadata.downloadUrl, '_blank');
      
      // Small delay to show feedback before resetting state
      setTimeout(() => {
        setIsDownloading(false);
      }, 500);
    } catch (error) {
      console.error('Error getting download URL:', error);
      setIsDownloading(false);
    }
  };

  useEffect(() => { 
    setIframeLoaded(false);
    setPreviewUrl(null);
    
    // Get direct preview URL on mount for PDF files
    if (file && isPdf) {
      fetch(`/api/stream?fileId=${file.id}&directLink=true`)
        .then(response => response.json())
        .then(data => setPreviewUrl(data.previewUrl))
        .catch(error => console.error('Error getting preview URL:', error));
    }
  }, [file, isPdf]);

  if (!file) return null;

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
          p="md"
          sx={(theme) => ({
            borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            height: 64,
          })}
        >
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
            {/* Left section: Close button */}
            <ActionIcon
              variant="subtle"
              onClick={onClose}
              size="lg"
              ml={4}
              sx={(theme) => ({
                color: theme.colorScheme === 'dark' ? theme.colors.red[4] : theme.colors.red[7],
                backgroundColor: theme.colorScheme === 'dark' 
                  ? theme.fn.rgba(theme.colors.red[8], 0.15)
                  : theme.fn.rgba(theme.colors.red[0], 0.15),
              })}
            >
              <IconX size={20} />
            </ActionIcon>
            
            {/* Navigation group - prev button, filename, next button */}
            <Group position="center" spacing={isMobile ? "xs" : "xl"} sx={{ 
              flex: 1, 
              maxWidth: isMobile ? 'calc(100% - 160px)' : 'calc(100% - 220px)', 
              margin: '0 auto' 
            }}>
              <ActionIcon
                variant="subtle"
                onClick={canGoPrevious ? () => onPrevious(previewableFiles[currentIndex - 1]) : undefined}
                disabled={!canGoPrevious}
                size="lg"
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  backgroundColor: theme.colorScheme === 'dark' 
                    ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                    : theme.fn.rgba(theme.colors.gray[0], 0.5),
                  opacity: canGoPrevious ? 1 : 0.5,
                  flexShrink: 0,
                })}
              >
                <IconChevronLeft size={20} />
              </ActionIcon>
              
              <Text 
                size={isMobile ? "md" : "lg"} 
                weight={500} 
                sx={{ 
                  maxWidth: isMobile ? 'calc(100% - 80px)' : 'calc(100% - 100px)',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.name}
              </Text>
              
              <ActionIcon
                variant="subtle"
                onClick={canGoNext ? () => onNext(previewableFiles[currentIndex + 1]) : undefined}
                disabled={!canGoNext}
                size="lg"
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  backgroundColor: theme.colorScheme === 'dark' 
                    ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                    : theme.fn.rgba(theme.colors.gray[0], 0.5),
                  opacity: canGoNext ? 1 : 0.5,
                  flexShrink: 0,
                })}
              >
                <IconChevronRight size={20} />
              </ActionIcon>
            </Group>
            
            {/* Download button */}
            <ActionIcon
              variant="subtle"
              onClick={() => handleDownload(file)}
              size="lg"
              mr={4}
              disabled={isDownloading}
              sx={(theme) => ({
                color: theme.colorScheme === 'dark' ? theme.colors.teal[4] : theme.colors.teal[7],
                backgroundColor: theme.colorScheme === 'dark' 
                  ? theme.fn.rgba(theme.colors.teal[8], 0.15)
                  : theme.fn.rgba(theme.colors.teal[0], 0.15),
                transform: isDownloading ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.2s ease',
                opacity: isDownloading ? 0.8 : 1,
              })}
            >
              <IconDownload size={20} />
            </ActionIcon>
          </Box>
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
            padding: 16,
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
                src={previewUrl || `/api/stream?fileId=${file.id}&inline=true`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
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