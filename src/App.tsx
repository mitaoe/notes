import { MantineProvider } from '@mantine/core';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Route, Routes } from 'react-router';

import { Layout } from './components/Layout.tsx';
import { FolderPage } from './pages/FolderPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { SearchPage } from './pages/SearchPage.tsx';
import { theme } from './theme.ts';

export function App() {
  return (
    <MantineProvider theme={theme} forceColorScheme="dark">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/search" element={<SearchPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<FolderPage />} />
          </Routes>
        </Layout>
        <Analytics />
      </BrowserRouter>
    </MantineProvider>
  );
}
