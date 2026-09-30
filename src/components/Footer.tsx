import { Anchor, Box, Container, Group, Text } from '@mantine/core';

import { site } from '../config.ts';

import classes from './Footer.module.css';

const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <Box component="footer" py="md" mt="xl" className={classes.footer}>
      <Container size="lg">
        <Group justify="space-between" align="center" gap="xl">
          <Text size="sm" c="dimmed">
            © {currentYear} {site.companyName}
          </Text>
          <Group gap="md">
            <Anchor href="/privacy.html" target="_blank" size="sm">
              Privacy Policy
            </Anchor>
            <Anchor href="/terms.html" target="_blank" size="sm">
              Terms of Service
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
