import { Box, Container, Group, Anchor, Text } from '@mantine/core';
import { uiConfig } from '../config';

function Footer() {
  return (
    <Box
      component="footer"
      py="md"
      mt="xl"
      sx={(theme) => ({
        borderTop: `1px solid ${theme.colors.dark[5]}`,
        backgroundColor: theme.colors.dark[7],
        marginTop: 'auto',
      })}
    >
      <Container size="lg">
        <Group justify="space-between" align="center" gap="xl" sx={{ 
          flexDirection: { base: 'column', sm: 'row' },
          gap: { base: '8px', sm: undefined },
        }}>
          <Text size="sm" c="dimmed">
            © {new Date().getFullYear()} {uiConfig.company_name}
          </Text>
          <Group gap="md" sx={{ 
            justifyContent: { base: 'center', sm: 'flex-end' },
            width: { base: '100%', sm: 'auto' }
          }}>
            <Anchor
              component="a"
              href="/privacy.html"
              target="_blank"
              size="sm"
              color={'gray'}
            >
              Privacy Policy
            </Anchor>
            <Anchor
              component="a"
              href="/terms.html"
              target="_blank"
              size="sm"
              color={'gray'}
            >
              Terms of Service
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}

export default Footer; 