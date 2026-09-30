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
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { site } from '../config.ts';
import { IconBrandGithub, IconMessage, IconSearch } from '../icons.ts';
import { Footer } from './Footer.tsx';
import { SearchBar } from './SearchBar.tsx';

import classes from './Layout.module.css';

const isSearchPath = (pathname: string) => pathname.startsWith('/search');

type SocialLinksProps = { size: 'lg' | 'xl'; variant: 'subtle' | 'light'; iconSize: number };

function SocialLinks({ size, variant, iconSize }: SocialLinksProps) {
  return (
    <>
      <ActionIcon
        component="a"
        href={site.githubUrl}
        target="_blank"
        size={size}
        variant={variant}
        color="gray"
        aria-label="GitHub"
      >
        <IconBrandGithub size={iconSize} />
      </ActionIcon>
      <ActionIcon
        component="a"
        href={site.contactUrl}
        target="_blank"
        size={size}
        variant={variant}
        color="gray"
        aria-label="Contact"
      >
        <IconMessage size={iconSize} />
      </ActionIcon>
    </>
  );
}

type LayoutProps = { children: ReactNode };

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);
  const [mobileSearchOpened, setMobileSearchOpened] = useState(false);

  const submittedQuery =
    location.pathname === '/search' ? (searchParams.get('q') ?? '').trim() : '';
  const [query, setQuery] = useState('');
  const [previous, setPrevious] = useState({ pathname: location.pathname, submittedQuery });

  if (previous.pathname !== location.pathname || previous.submittedQuery !== submittedQuery) {
    setPrevious({ pathname: location.pathname, submittedQuery });
    if (submittedQuery && submittedQuery !== previous.submittedQuery) setQuery(submittedQuery);
    if (previous.pathname !== location.pathname && !isSearchPath(location.pathname)) {
      setQuery('');
      setMobileSearchOpened(false);
    }
  }

  const search = () => {
    const trimmed = query.trim();
    if (trimmed) void navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const clear = () => {
    setQuery('');
    if (location.pathname === '/search') void navigate('/');
  };

  const closeMobileSearch = () => {
    if (!isSearchPath(location.pathname) && !query.trim()) setMobileSearchOpened(false);
  };

  return (
    <AppShell padding="md" header={{ height: 60 }} classNames={{ main: classes.main }}>
      <AppShell.Header className={classes.header}>
        <Container size="lg" h="100%">
          <Group justify="space-between" h="100%" gap="xl">
            <Group gap="xl">
              <Link to="/" className={classes.logoLink}>
                <Image
                  src={site.logoUrl}
                  alt={site.name}
                  width={35}
                  height={35}
                  className={classes.logo}
                />
              </Link>
            </Group>

            <Group gap="xl" className={classes.desktopOnly}>
              <SearchBar query={query} onQueryChange={setQuery} onSearch={search} onClear={clear} />
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
        <Drawer
          opened={mobileMenuOpened}
          onClose={() => setMobileMenuOpened(false)}
          position="right"
          size="xs"
          classNames={{ content: classes.drawerContent }}
        >
          <Box p="md">
            <Group mb="xl">
              <SocialLinks size="xl" variant="light" iconSize={24} />
            </Group>
          </Box>
        </Drawer>

        <Container size="lg">
          <Stack gap="xs" className={classes.page}>
            <Box>{children}</Box>
            <Footer />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
