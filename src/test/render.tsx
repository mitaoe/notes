import { MantineProvider } from '@mantine/core';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { theme } from '../theme.ts';
import { CurrentLocation } from './CurrentLocation.tsx';

export const renderWithProviders = (ui: ReactNode, route = '/') =>
  render(
    <MantineProvider theme={theme} env="test">
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                {ui}
                <CurrentLocation />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
