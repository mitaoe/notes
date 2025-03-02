import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Folder } from './pages/Folder';
import { Search } from './pages/Search';
import { NotFound } from './pages/NotFound';
import { config, uiConfig } from './config';
import { SearchProvider } from './contexts/SearchContext';

function App() {
  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        colorScheme: uiConfig.theme === 'darkly' ? 'dark' : 'light',
        primaryColor: 'blue',
        colors: {
          dark: [
            '#C1C2C5',
            '#A6A7AB',
            '#909296',
            '#5C5F66',
            '#373A40',
            '#2C2E33',
            '#25262B',
            '#1A1B1E',
            '#141517',
            '#101113',
          ],
          blue: [
            '#DBE5F8',
            '#B7CCF1',
            '#93B3EA',
            '#6F9AE3',
            '#4B81DC',
            '#2768D5',
            '#1A73E8',
            '#1557B0',
            '#104489',
            '#0B3162',
          ],
        },
        fontFamily: config.font_family || 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        headings: {
          fontFamily: config.font_family || 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        },
        components: {
          Button: {
            styles: (theme) => ({
              root: {
                fontWeight: 500,
                backgroundColor: uiConfig.header_style_class.includes('bg-primary') ? '#1a73e8' : '#343a40',
                color: uiConfig.header_text_color || 'white',
                '&:hover': {
                  backgroundColor: uiConfig.header_style_class.includes('bg-primary') ? '#1557B0' : '#23272B',
                },
              },
            }),
          },
          TextInput: {
            styles: {
              input: {
                '&:focus': {
                  borderColor: uiConfig.header_style_class.includes('bg-primary') ? '#1A73E8' : '#343a40',
                },
              },
            },
          },
          Anchor: {
            styles: (theme) => ({
              root: {
                color: uiConfig.css_a_tag_color,
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
            }),
          },
          Text: {
            styles: (theme) => ({
              root: {
                color: uiConfig.css_p_tag_color,
              },
            }),
          },
          Header: {
            styles: (theme) => ({
              root: {
                backgroundColor: uiConfig.header_style_class.includes('bg-primary') 
                  ? theme.colorScheme === 'dark' ? '#1A1B1E' : '#1a73e8'
                  : theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
              },
            }),
          },
        },
        other: {
          siteName: config.siteName,
          siteDescription: config.siteDescription,
          maxFileSize: config.max_size_gb ? `${config.max_size_gb}GB` : 'Unlimited',
        }
      }}
    >
      <Helmet>
        <title>MITAOE Notes - By Students, For Students | MIT Academy of Engineering</title>
        <meta name="description" content="A student-driven platform for MITAOE engineering notes and study materials. Created by students, shared by students, helping everyone succeed together at MIT Academy of Engineering." />
        <meta name="keywords" content="MITAOE, MIT Academy of Engineering, student notes, engineering notes, study materials, student resources, peer learning, MITAOE student community, engineering study materials, Alandi, Pune, student-shared notes" />
        <meta property="og:title" content="MITAOE Notes - By Students, For Students | MIT Academy of Engineering" />
        <meta property="og:description" content="Join your fellow MITAOE students in sharing and accessing course materials. A community-driven resource hub created by students, for students." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mitaoe-notes.vercel.app" />
        <meta property="og:site_name" content="MITAOE Student Notes" />
        <meta property="og:image" content="https://mitaoe-notes.vercel.app/favicon.ico" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="MITAOE Notes - Student Community Hub" />
        <meta name="twitter:description" content="Student-curated academic resources for MIT Academy of Engineering. Learn together, grow together." />
        <meta name="twitter:image" content="https://mitaoe-notes.vercel.app/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="author" content="MITAOE Student Community" />
        <meta name="msapplication-TileImage" content="/favicon.ico" />
        <meta name="msapplication-TileColor" content="#1A73E8" />
        <meta name="theme-color" content="#1A73E8" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="canonical" href="https://mitaoe-notes.vercel.app" />
      </Helmet>
      <Router>
        <SearchProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/*" element={<Folder />} />
              <Route path="/404" element={<NotFound />} />
            </Routes>
          </Layout>
        </SearchProvider>
        <Analytics />
      </Router>
    </MantineProvider>
  );
}

export default App;
