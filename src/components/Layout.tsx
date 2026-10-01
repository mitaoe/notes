import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Container,
  Drawer,
  Group,
  Image,
  Stack,
} from '@mantine/core';
import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { MAX_SEARCH_LENGTH } from '../../shared/drive.ts';
import { routes, site } from '../config.ts';
import { useSearchQuery } from '../hooks/useSearchQuery.ts';
import { IconSearch } from '../icons.ts';
import { Footer } from './Footer.tsx';
import { SearchBar } from './SearchBar.tsx';
import { SocialLinks } from './SocialLinks.tsx';

import classes from './Layout.module.css';

const HEADER_HEIGHT = 60;
const LOGO_SIZE = 35;

type LayoutProps = { children: ReactNode };

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);
  const [mobileSearchOpened, setMobileSearchOpened] = useState(false);

  const searchQuery = useSearchQuery();
  const onSearchPage = searchQuery !== null;
  const submittedQuery = (searchQuery ?? '').slice(0, MAX_SEARCH_LENGTH);
  const [query, setQuery] = useState(submittedQuery);
  const { pathname } = location;
  const [previous, setPrevious] = useState({ pathname, onSearchPage, submittedQuery });

  if (
    previous.pathname !== pathname ||
    previous.onSearchPage !== onSearchPage ||
    previous.submittedQuery !== submittedQuery
  ) {
    setPrevious({ pathname, onSearchPage, submittedQuery });
    if (submittedQuery && submittedQuery !== previous.submittedQuery) setQuery(submittedQuery);
    if (!onSearchPage && (previous.pathname !== pathname || previous.onSearchPage)) {
      setQuery('');
      setMobileSearchOpened(false);
    }
  }

  const search = () => {
    const trimmed = query.trim();
    if (trimmed) void navigate(`${routes.search}?q=${encodeURIComponent(trimmed)}`);
  };

  const clear = () => {
    setQuery('');
    if (onSearchPage) void navigate(routes.home);
  };

  const closeMobileSearch = () => {
    if (!onSearchPage && !query.trim()) setMobileSearchOpened(false);
  };

  return (
    <AppShell padding="md" header={{ height: HEADER_HEIGHT }} classNames={{ main: classes.main }}>
      <AppShell.Header className={classes.header}>
        <Container size="lg" h="100%">
          <Group justify="space-between" h="100%" gap="xl">
            <Group gap="xl">
              <Link to={routes.home} className={classes.logoLink}>
                <Image
                  src={site.logoUrl}
                  alt={site.name}
                  width={LOGO_SIZE}
                  height={LOGO_SIZE}
                  className={classes.logo}
                />
              </Link>
            </Group>

            <Group gap="xl" className={classes.desktopOnly}>
              <SearchBar
                isMobile={false}
                query={query}
                onQueryChange={setQuery}
                onSearch={search}
                onClear={clear}
                onClickOutside={null}
              />
              <SocialLinks size="lg" variant="subtle" iconSize={22} />
            </Group>

            <Box className={classes.mobileOnly}>
              <Group gap="sm">
                {mobileSearchOpened ? (
                  <SearchBar
                    isMobile
                    query={query}
                    onQueryChange={setQuery}
                    onSearch={search}
                    onClear={clear}
                    onClickOutside={closeMobileSearch}
                  />
                ) : (
                  <ActionIcon
                    onClick={() => setMobileSearchOpened(true)}
                    size="lg"
                    variant="subtle"
                    color="gray"
                    aria-label="Open search"
                  >
                    <IconSearch size={22} />
                  </ActionIcon>
                )}
                <Burger
                  opened={mobileMenuOpened}
                  onClick={() => setMobileMenuOpened((opened) => !opened)}
                  size="sm"
                  color="gray.5"
                  aria-label="Toggle menu"
                />
              </Group>
            </Box>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Drawer.Root
          opened={mobileMenuOpened}
          onClose={() => setMobileMenuOpened(false)}
          position="right"
          size="xs"
          classNames={{ content: classes.drawerContent }}
        >
          <Drawer.Overlay />
          <Drawer.Content aria-label="Menu">
            <Drawer.Header>
              <Drawer.CloseButton aria-label="Close menu" />
            </Drawer.Header>
            <Drawer.Body>
              <Box p="md">
                <Group mb="xl">
                  <SocialLinks size="xl" variant="light" iconSize={24} />
                </Group>
              </Box>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Root>

        <Container size="lg">
          <Stack gap="xs" className={classes.page}>
            <Box key={location.key}>{children}</Box>
            <Footer />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
