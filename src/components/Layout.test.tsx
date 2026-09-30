import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { LOCATION_TEST_ID } from '../test/CurrentLocation.tsx';
import { renderWithProviders } from '../test/render.tsx';
import { Layout } from './Layout.tsx';

const searchInput = () => screen.getByRole('textbox', { name: 'Search files' });

describe('Layout search', () => {
  it('navigates to the search page with the trimmed query', async () => {
    renderWithProviders(<Layout>page</Layout>);

    await userEvent.type(searchInput(), '  unit 1  {Enter}');

    expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/search?q=unit%201');
  });

  it('goes home when clearing on the search page', async () => {
    renderWithProviders(<Layout>page</Layout>, '/search?q=unit');

    await userEvent.type(searchInput(), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent(/^\/$/);
    expect(searchInput()).toHaveValue('');
  });

  it('renders the page content and footer links', () => {
    renderWithProviders(<Layout>page body</Layout>);
    expect(screen.getByText('page body')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy.html',
    );
  });
});
