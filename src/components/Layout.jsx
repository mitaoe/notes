import React from 'react';
import { Container, Group, Text, TextInput, createStyles, Burger, Drawer } from '@mantine/core';
import { IconSearch, IconHome, IconFolder } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { config, uiConfig } from '../config';

const useStyles = createStyles((theme) => ({
  header: {
    backgroundColor: theme.colors.blue[7],
    borderBottom: 0,
    position: uiConfig.fixed_header ? 'fixed' : 'relative',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 100,
    padding: '0 20px',
  },
  headerContent: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '@media (max-width: 768px)': {
      flexWrap: 'nowrap',
    },
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: 24,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      fontSize: 20,
    },
  },
  logoImage: {
    maxHeight: '40px',
    width: 'auto',
    '@media (max-width: 768px)': {
      maxHeight: '30px',
    },
  },
  nav: {
    display: 'flex',
    gap: 20,
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  mobileNav: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    },
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  searchForm: {
    flex: 1,
    maxWidth: 400,
    marginLeft: 20,
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  mobileSearchForm: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'block',
      width: '100%',
      marginTop: 10,
    },
  },
  burger: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'block',
    },
  },
  main: {
    marginTop: uiConfig.fixed_header ? 90 : 20,
    minHeight: 'calc(100vh - 90px)',
    padding: '0 20px',
  },
}));

export function Layout({ children }) {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [mobileMenuOpened, setMobileMenuOpened] = React.useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpened(false);
    }
  };

  return (
    <>
      <header className={classes.header}>
        <div className={classes.headerContent}>
          <Group spacing="sm">
            {uiConfig.logo_image ? (
              <Link to="/" className={classes.logo}>
                <img 
                  src={uiConfig.logo_link_name} 
                  alt={config.siteName}
                  className={classes.logoImage}
                />
              </Link>
            ) : (
              <Link to="/" className={classes.logo}>
                {config.siteName}
              </Link>
            )}
          </Group>

          <nav className={classes.nav}>
            <Link to="/" className={classes.navLink}>
              {uiConfig.nav_link_1}
            </Link>
            <Link to="/current" className={classes.navLink}>
              {uiConfig.nav_link_3}
            </Link>
            <a href={uiConfig.contact_link} target="_blank" rel="noopener noreferrer" className={classes.navLink}>
              {uiConfig.nav_link_4}
            </a>
          </nav>

          <form onSubmit={handleSearch} className={classes.searchForm}>
            <TextInput
              placeholder="Search files..."
              icon={<IconSearch size={14} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              styles={{
                input: {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                },
              }}
            />
          </form>

          <Burger
            opened={mobileMenuOpened}
            onClick={() => setMobileMenuOpened((o) => !o)}
            className={classes.burger}
            color="white"
          />
        </div>
      </header>

      <Drawer
        opened={mobileMenuOpened}
        onClose={() => setMobileMenuOpened(false)}
        padding="xl"
        size="100%"
        position="right"
      >
        <div className={classes.mobileNav}>
          <Link to="/" className={classes.navLink} onClick={() => setMobileMenuOpened(false)}>
            {uiConfig.nav_link_1}
          </Link>
          <Link to="/current" className={classes.navLink} onClick={() => setMobileMenuOpened(false)}>
            {uiConfig.nav_link_3}
          </Link>
          <a 
            href={uiConfig.contact_link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={classes.navLink}
            onClick={() => setMobileMenuOpened(false)}
          >
            {uiConfig.nav_link_4}
          </a>
          <form onSubmit={handleSearch} className={classes.mobileSearchForm}>
            <TextInput
              placeholder="Search files..."
              icon={<IconSearch size={14} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      </Drawer>

      <main className={classes.main}>
        <Container size="lg">
          {children}
        </Container>
      </main>

      {!uiConfig.hide_footer && (
        <footer style={{ 
          backgroundColor: uiConfig.header_style_class.includes('bg-primary') ? '#1a73e8' : '#343a40',
          color: 'white',
          padding: '20px 0',
          textAlign: 'center',
          position: uiConfig.fixed_footer ? 'fixed' : 'relative',
          bottom: 0,
          width: '100%'
        }}>
          <Container size="lg">
            <Text>© {uiConfig.copyright_year} - <a href={uiConfig.company_link} style={{ color: 'white' }}>{uiConfig.company_name}</a></Text>
            {uiConfig.credit && (
              <Text size="sm" mt={5}>
                Powered by Google Drive Index
              </Text>
            )}
          </Container>
        </footer>
      )}
    </>
  );
} 