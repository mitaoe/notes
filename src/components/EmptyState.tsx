import { Box, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';
import classes from './EmptyState.module.css';

export function EmptyState() {
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
          Much like a professor&apos;s office during exam week, this folder appears to be vacant.
        </Text>
      </Stack>
    </Box>
  );
}
