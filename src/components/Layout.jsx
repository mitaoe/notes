import React, { useState, useEffect } from 'react';
import { AppShell, Header, Container, Group, ActionIcon, Box, Burger, Drawer, Image, useMantineTheme } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { IconSearch, IconBrandGithub, IconMessage } from '@tabler/icons-react';
import { config, uiConfig } from '../config';
import { useSearch } from '../contexts/SearchContext';
import { SearchBar } from './SearchBar';

export function Layout({ children }) {
  const theme = useMantineTheme();
  const location = useLocation();
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);
  const [mobileSearchOpened, setMobileSearchOpened] = useState(false);
  const { clearSearch } = useSearch();

  useEffect(() => {
    if (!location.pathname.startsWith('/search')) {
      clearSearch();
      setMobileSearchOpened(false);
    }
  }, [location.pathname, clearSearch]);

  return (
    <AppShell
      padding="md"
      header={
        <Header height={60} fixed={uiConfig.fixed_header} 
          sx={(theme) => ({
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
            borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
          })}
        >
          <Container size="lg" h="100%">
            <Group position="apart" h="100%" spacing="xl">
              <Group spacing="xl">
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
              <Group spacing="xl" sx={{ '@media (max-width: 768px)': { display: 'none' } }}>
                <SearchBar />
                <ActionIcon
                  component="a"
                  href="https://github.com/AdityaKotkar47/notes"
                  target="_blank"
                  size="lg"
                  variant="subtle"
                  color={theme.colorScheme === 'dark' ? 'gray' : 'dark'}
                >
                  <IconBrandGithub size={22} />
                </ActionIcon>
                <ActionIcon
                  component="a"
                  href={uiConfig.contact_link}
                  target="_blank"
                  size="lg"
                  variant="subtle"
                  color={theme.colorScheme === 'dark' ? 'gray' : 'dark'}
                >
                  <IconMessage size={22} />
                </ActionIcon>
              </Group>

              {/* Mobile Navigation */}
              <Box sx={{ '@media (min-width: 769px)': { display: 'none' } }}>
                <Group spacing="sm">
                  {!mobileSearchOpened ? (
                    <ActionIcon 
                      onClick={() => setMobileSearchOpened(true)}
                      size="lg"
                      variant="subtle"
                      color={theme.colorScheme === 'dark' ? 'gray' : 'dark'}
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
                    color={theme.colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.dark[6]}
                  />
                </Group>
              </Box>
            </Group>
          </Container>
        </Header>
      }
      styles={(theme) => ({
        main: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
          paddingTop: '60px',
          minHeight: '100vh',
        },
      })}
    >
      {/* Mobile Menu Drawer */}
      <Drawer
        opened={mobileMenuOpened}
        onClose={() => setMobileMenuOpened(false)}
        position="right"
        size="xs"
        styles={{
          drawer: {
            background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          },
        }}
      >
        <Box p="md">
          <Group mb="xl">
            <ActionIcon
              component="a"
              href="https://github.com/AdityaKotkar47/notes"
              target="_blank"
              size="xl"
              variant="light"
              color={theme.colorScheme === 'dark' ? 'gray' : 'dark'}
            >
              <IconBrandGithub size={24} />
            </ActionIcon>
            <ActionIcon
              component="a"
              href={uiConfig.contact_link}
              target="_blank"
              size="xl"
              variant="light"
              color={theme.colorScheme === 'dark' ? 'gray' : 'dark'}
            >
              <IconMessage size={24} />
            </ActionIcon>
          </Group>
        </Box>
      </Drawer>

      <Container size="lg">
        {children}
      </Container>
    </AppShell>
  );
} 