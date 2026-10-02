import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { MAX_SEARCH_LENGTH } from '../../shared/drive.ts';
import { LOCATION_TEST_ID } from '../test/CurrentLocation.tsx';
import { renderWithProviders } from '../test/render.tsx';
import { Layout } from './Layout.tsx';

const renderLayout = (route = '/') =>
  renderWithProviders(
    <Layout>
      <Link to="/fy">open fy</Link>
      <p>page text</p>
    </Layout>,
    route,
  );

const location = () => screen.getByTestId(LOCATION_TEST_ID);

describe('Layout', () => {
  it('navigates to the search page with the trimmed query', async () => {
    renderLayout();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search files' }),
      '  unit 1  {Enter}',
    );

    expect(location().textContent).toBe('/search?q=unit+1');
  });

  it('goes home when clearing on the search page', async () => {
    renderLayout('/search?q=unit');

    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(location().textContent).toBe('/');
    expect(screen.getByRole('textbox', { name: 'Search files' })).toHaveValue('');
  });

  it('clears the search box after leaving the search page', async () => {
    renderLayout();
    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), 'unit{Enter}');
    expect(screen.getByRole('textbox', { name: 'Search files' })).toHaveValue('unit');

    await userEvent.click(screen.getByRole('link', { name: 'open fy' }));

    expect(location().textContent).toBe('/fy');
    expect(screen.getByRole('textbox', { name: 'Search files' })).toHaveValue('');
  });

  it('clears the search box when a search gives way to the folder named search', async () => {
    renderWithProviders(
      <Layout>
        <Link to="/search">open the search folder</Link>
      </Layout>,
      '/search',
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), 'unit{Enter}');
    expect(location().textContent).toBe('/search?q=unit');

    await userEvent.click(screen.getByRole('link', { name: 'open the search folder' }));

    expect(location().textContent).toBe('/search');
    expect(screen.getByRole('textbox', { name: 'Search files' })).toHaveValue('');
  });

  it('submits a search cut at the limit without splitting a character', async () => {
    const kept = 'a'.repeat(MAX_SEARCH_LENGTH - 1);
    renderLayout(`/search?${new URLSearchParams({ q: `${kept}\u{1F600}b` })}`);
    const box = screen.getByRole('textbox', { name: 'Search files' });
    expect(box).toHaveValue(kept);

    await userEvent.type(box, '{Enter}');

    expect(location().textContent).toBe(`/search?q=${kept}`);
  });

  it('shows the query when a search link is opened directly', () => {
    renderLayout('/search/?q=%20unit%201%20');
    expect(screen.getByRole('textbox', { name: 'Search files' })).toHaveValue('unit 1');
  });

  it('closes the empty mobile search when clicking elsewhere', async () => {
    renderLayout();

    await userEvent.click(screen.getByRole('button', { name: 'Open search' }));
    expect(screen.getAllByRole('textbox', { name: 'Search files' })).toHaveLength(2);

    await userEvent.click(screen.getByText('page text'));

    expect(screen.getAllByRole('textbox', { name: 'Search files' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Open search' })).toBeInTheDocument();
  });

  it.each(['/search_notes', '/search', '/search?q=%20'])(
    'treats %s as a folder, not the search page',
    async (route) => {
      renderLayout(route);

      await userEvent.click(screen.getByRole('button', { name: 'Open search' }));
      await userEvent.click(screen.getByText('page text'));

      expect(screen.getByRole('button', { name: 'Open search' })).toBeInTheDocument();
    },
  );

  it('keeps the mobile search open when clicking elsewhere with a query', async () => {
    renderLayout();

    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), 'unit');
    await userEvent.click(screen.getByRole('button', { name: 'Open search' }));
    await userEvent.click(screen.getByText('page text'));

    expect(screen.getAllByRole('textbox', { name: 'Search files' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Open search' })).not.toBeInTheDocument();
  });

  it('names the mobile menu and its close button', async () => {
    renderLayout();

    await userEvent.click(screen.getByRole('button', { name: 'Toggle menu' }));
    expect(await screen.findByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close menu' }));

    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('renders the footer links', () => {
    renderLayout();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy.html',
    );
  });
});
