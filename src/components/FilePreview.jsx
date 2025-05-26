import PropTypes from 'prop-types';
import { Modal, Box, Group, Text, Loader, ActionIcon, Paper, Stack } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconX, IconDownload, IconShare, IconStar, IconDotsVertical } from '@tabler/icons-react';
import { useHotkeys } from '@mantine/hooks';

const FilePreview = ({ 
  opened, 
  onClose, 
  file, 
  onNext, 
  onPrevious,
  loading 
}) => {
  const isPdf = file?.mimeType === 'application/pdf';

  useHotkeys([
    ['ArrowRight', onNext],
    ['ArrowLeft', onPrevious],
    ['Escape', onClose],
  ]);

  if (!file) return null;

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
          })}
        >
          <Group position="apart" align="center">
            <Group spacing="xl">
              <Group spacing="xs">
                <ActionIcon
                  variant="subtle"
                  onClick={onPrevious}
                  disabled={!onPrevious}
                  size="lg"
                  sx={(theme) => ({
                    color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                    '&:hover': {
                      backgroundColor: theme.colorScheme === 'dark' 
                        ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                        : theme.fn.rgba(theme.colors.gray[0], 0.5),
                    }
                  })}
                >
                  <IconChevronLeft size={20} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  onClick={onNext}
                  disabled={!onNext}
                  size="lg"
                  sx={(theme) => ({
                    color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                    '&:hover': {
                      backgroundColor: theme.colorScheme === 'dark' 
                        ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                        : theme.fn.rgba(theme.colors.gray[0], 0.5),
                    }
                  })}
                >
                  <IconChevronRight size={20} />
                </ActionIcon>
              </Group>
              <Stack spacing={0}>
                <Text size="lg" weight={500}>
                  {file.name}
                </Text>
                <Text size="sm" color="dimmed">
                  {file.mimeType}
                </Text>
              </Stack>
            </Group>
            <Group spacing="xs">
              <ActionIcon
                variant="subtle"
                size="lg"
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                      : theme.fn.rgba(theme.colors.gray[0], 0.5),
                  }
                })}
              >
                <IconStar size={20} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="lg"
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                      : theme.fn.rgba(theme.colors.gray[0], 0.5),
                  }
                })}
              >
                <IconShare size={20} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="lg"
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                      : theme.fn.rgba(theme.colors.gray[0], 0.5),
                  }
                })}
              >
                <IconDownload size={20} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={onClose}
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                      : theme.fn.rgba(theme.colors.gray[0], 0.5),
                  }
                })}
              >
                <IconX size={20} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="lg"
                sx={(theme) => ({
                  color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[7],
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.fn.rgba(theme.colors.gray[8], 0.5)
                      : theme.fn.rgba(theme.colors.gray[0], 0.5),
                  }
                })}
              >
                <IconDotsVertical size={20} />
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
            backgroundColor: 'var(--mantine-color-body)',
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
};

export default FilePreview; 