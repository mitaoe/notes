import { Box, Stack, Text, ThemeIcon } from '@mantine/core';

import { IconInbox } from '../icons.ts';

import classes from './EmptyState.module.css';

type EmptyStateProps = { message: string };

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Box className={classes.wrapper}>
      <Stack align="center" gap="xs" py={50}>
        <ThemeIcon size={80} radius={100} variant="light" className={classes.icon}>
          <IconInbox size={40} />
        </ThemeIcon>
        <Text size="xl" fw={500}>
          Looks rather empty here
        </Text>
        <Text size="sm" c="dimmed" ta="center" px="lg">
          {message}
        </Text>
      </Stack>
    </Box>
  );
}
