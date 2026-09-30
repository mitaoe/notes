import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router';
import { describe, expect, it } from 'vitest';

import { LOCATION_TEST_ID } from '../test/CurrentLocation.tsx';
import { renderWithProviders } from '../test/render.tsx';
import { Layout } from './Layout.tsx';

const renderLayout = (route = '/') =>
  renderWithProviders(
    <Layout>
      <Link to="/fy">open fy</Link>
    </Layout>,
    route,
  );

const location = () => screen.getByTestId(LOCATION_TEST_ID);

describe('Layout search', () => {
  it('navigates to the search page with the trimmed query', async () => {
    renderLayout();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search files' }),
      '  unit 1  {Enter}',
    );

    expect(location()).toHaveTextContent('/search?q=unit%201');
  });

  it('goes home when clearing on the search page', async () => {
    renderLayout('/search?q=unit');

    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(location()).toHaveTextContent(/^\/$/);
    expect(screen.getByRole('textbox', { name: 'Search files' })).toHaveValue('');
  });

  it('clears the search box after leaving the search page', async () => {
    renderLayout();
    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), 'unit{Enter}');
    expect(screen.getByRole('textbox', { name: 'Search files' })).toHaveValue('unit');

    await userEvent.click(screen.getByRole('link', { name: 'open fy' }));

    expect(location()).toHaveTextContent('/fy');
    expect(screen.getByRole('textbox', { name: 'Search files' })).toHaveValue('');
  });

  it('keeps the search box empty when a search link is opened directly', () => {
    renderLayout('/search?q=unit');
    expect(screen.getByRole('textbox', { name: 'Search files' })).toHaveValue('');
  });

  it('closes the empty mobile search when clicking elsewhere', async () => {
    renderLayout();

    await userEvent.click(screen.getByRole('button', { name: 'Open search' }));
    expect(screen.getAllByRole('textbox', { name: 'Search files' })).toHaveLength(2);

    await userEvent.click(screen.getByRole('link', { name: 'open fy' }));

    expect(screen.getByRole('button', { name: 'Open search' })).toBeInTheDocument();
  });

  it('renders the footer links', () => {
    renderLayout();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy.html',
    );
  });
});
