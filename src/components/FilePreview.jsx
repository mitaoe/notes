import PropTypes from 'prop-types';
import { Modal, Box, Group, Button, Text, Loader } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
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
      styles={{
        modal: {
          backgroundColor: 'transparent',
        },
        body: {
          padding: 0,
          height: '100%',
        },
      }}
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
        <Group
          position="apart"
          p="md"
          sx={{
            borderBottom: '1px solid var(--mantine-color-gray-3)',
            backgroundColor: 'var(--mantine-color-body)',
          }}
        >
          <Group>
            <Button
              variant="subtle"
              leftIcon={<IconChevronLeft size={16} />}
              onClick={onPrevious}
              disabled={!onPrevious}
            >
              Previous
            </Button>
            <Button
              variant="subtle"
              rightIcon={<IconChevronRight size={16} />}
              onClick={onNext}
              disabled={!onNext}
            >
              Next
            </Button>
          </Group>
          <Group>
            <Text size="sm" color="dimmed">
              {file.name}
            </Text>
            <Button
              variant="subtle"
              color="gray"
              onClick={onClose}
              leftIcon={<IconX size={16} />}
            >
              Close
            </Button>
          </Group>
        </Group>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
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
              <Text color="dimmed">Preview not available for this file type</Text>
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