import { useState } from 'react';
import PropTypes from 'prop-types';
import { AppShell, Container, Group, ActionIcon, Box, Burger, Drawer, Image, useMantineTheme, Stack } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { IconSearch, IconBrandGithub, IconMessage } from '@tabler/icons-react';
import { config, uiConfig } from '../config';
import SearchBar from './SearchBar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const theme = useMantineTheme();
  const location = useLocation();
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);
  const [mobileSearchOpened, setMobileSearchOpened] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (!location.pathname.startsWith('/search') && mobileSearchOpened) {
      setMobileSearchOpened(false);
    }
  }

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      styles={(theme) => ({
        main: {
          backgroundColor: theme.colors.dark[8],
          minHeight: '100vh',
        },
      })}
    >
      <AppShell.Header
        sx={(theme) => ({
          backgroundColor: theme.colors.dark[7],
          borderBottom: `1px solid ${theme.colors.dark[5]}`,
        })}
      >
          <Container size="lg" h="100%">
            <Group justify="space-between" h="100%" gap="xl">
              <Group gap="xl">
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  <Image
                    src={uiConfig.logo_link_name}
                    alt={config.siteName}
                    width={35}
                    height={35}
                    sx={{ borderRadius: '50%' }}
                  />
                </Link>
              </Group>

              {/* Desktop Navigation */}
              <Group gap="xl" sx={{ '@media (max-width: 768px)': { display: 'none' } }}>
                <SearchBar />
                <ActionIcon
                  component="a"
                  href="https://github.com/mitaoe/notes"
                  target="_blank"
                  size="lg"
                  variant="subtle"
                  color={'gray'}
                >
                  <IconBrandGithub size={22} />
                </ActionIcon>
                <ActionIcon
                  component="a"
                  href={uiConfig.contact_link}
                  target="_blank"
                  size="lg"
                  variant="subtle"
                  color={'gray'}
                >
                  <IconMessage size={22} />
                </ActionIcon>
              </Group>

              {/* Mobile Navigation */}
              <Box sx={{ '@media (min-width: 769px)': { display: 'none' } }}>
                <Group gap="sm">
                  {!mobileSearchOpened ? (
                    <ActionIcon 
                      onClick={() => setMobileSearchOpened(true)}
                      size="lg"
                      variant="subtle"
                      color={'gray'}
                    >
                      <IconSearch size={22} />
                    </ActionIcon>
                  ) : (
                    <SearchBar 
                      isMobile 
                      onSearchClose={() => setMobileSearchOpened(false)} 
                    />
                  )}
                  <Burger
                    opened={mobileMenuOpened}
                    onClick={() => setMobileMenuOpened(!mobileMenuOpened)}
                    size="sm"
                    color={theme.colors.gray[5]}
                  />
                </Group>
              </Box>
            </Group>
          </Container>
      </AppShell.Header>

      <AppShell.Main>
      {/* Mobile Menu Drawer */}
      <Drawer
        opened={mobileMenuOpened}
        onClose={() => setMobileMenuOpened(false)}
        position="right"
        size="xs"
        styles={{
          content: {
            background: theme.colors.dark[7],
          },
        }}
      >
        <Box p="md">
          <Group mb="xl">
            <ActionIcon
              component="a"
              href="https://github.com/mitaoe/notes"
              target="_blank"
              size="xl"
              variant="light"
              color={'gray'}
            >
              <IconBrandGithub size={24} />
            </ActionIcon>
            <ActionIcon
              component="a"
              href={uiConfig.contact_link}
              target="_blank"
              size="xl"
              variant="light"
              color={'gray'}
            >
              <IconMessage size={24} />
            </ActionIcon>
          </Group>
        </Box>
      </Drawer>

      <Container size="lg">
        <Stack gap="xs" sx={{ minHeight: 'calc(100vh - 60px)', justifyContent: 'space-between' }}>
          <Box>
            {children}
          </Box>
          <Footer />
        </Stack>
      </Container>
      </AppShell.Main>
    </AppShell>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout; 