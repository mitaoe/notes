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
        <title>MITAOE Notes - Student Resource Hub</title>
        <meta name="description" content="Access and share academic notes, study materials, and resources for MITAOE (MIT Academy of Engineering) students. A comprehensive collection of course materials and educational resources." />
        <meta name="keywords" content="MITAOE, MIT Academy of Engineering, notes, study materials, engineering notes, academic resources, student notes, mitaoe-notes" />
        <meta property="og:title" content="MITAOE Notes - Student Resource Hub" />
        <meta property="og:description" content="Access and share academic notes and study materials for MITAOE students." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mitaoe-notes.vercel.app" />
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
