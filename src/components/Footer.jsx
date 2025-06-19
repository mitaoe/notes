import { Box, Container, Group, Anchor, Text, useMantineTheme } from '@mantine/core';
import { uiConfig } from '../config';

function Footer() {
  const theme = useMantineTheme();
  
  return (
    <Box
      component="footer"
      py="md"
      mt="xl"
      sx={(theme) => ({
        borderTop: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        marginTop: 'auto',
      })}
    >
      <Container size="lg">
        <Group position="apart" align="center" spacing="xl" sx={{ 
          flexDirection: { base: 'column', sm: 'row' },
          gap: { base: '8px', sm: undefined },
        }}>
          <Text size="sm" color="dimmed">
            © {new Date().getFullYear()} {uiConfig.company_name}
          </Text>
          <Group spacing="md" sx={{ 
            justifyContent: { base: 'center', sm: 'flex-end' },
            width: { base: '100%', sm: 'auto' }
          }}>
            <Anchor
              component="a"
              href="/privacy.html"
              target="_blank"
              size="sm"
              color={theme.colorScheme === 'dark' ? 'gray' : 'dark'}
            >
              Privacy Policy
            </Anchor>
            <Anchor
              component="a"
              href="/terms.html"
              target="_blank"
              size="sm"
              color={theme.colorScheme === 'dark' ? 'gray' : 'dark'}
            >
              Terms of Service
            </Anchor>
            <Anchor
              component="button"
              onClick={() => {
                localStorage.removeItem('welcomeBannerDismissed');
                alert('Welcome message restored. Refresh the page to see it again.');
              }}
              size="sm"
              color={theme.colorScheme === 'dark' ? 'gray' : 'dark'}
            >
              Restore Welcome Message
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}

export default Footer;
