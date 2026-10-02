import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/render.tsx';
import { BreadcrumbNav } from './BreadcrumbNav.tsx';

const LONG_CLASS = /long/;

describe('BreadcrumbNav', () => {
  it('links every level of the path', () => {
    renderWithProviders(<BreadcrumbNav pathname="/fy/00_journals" search="" />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'fy' })).toHaveAttribute('href', '/fy');
    expect(screen.getByRole('link', { name: '00_journals' })).toHaveAttribute(
      'href',
      '/fy/00_journals',
    );
  });

  it('keeps the query string on the current page only', () => {
    renderWithProviders(<BreadcrumbNav pathname="/search" search="?q=unit%201" />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'search' })).toHaveAttribute(
      'href',
      '/search?q=unit%201',
    );
  });

  it('decodes names and marks long encoded segments for truncation', () => {
    const name = 'Object Oriented Programming';
    renderWithProviders(
      <BreadcrumbNav pathname={`/${encodeURIComponent(name)}/short`} search="" />,
    );

    expect(screen.getByRole('link', { name }).className).toMatch(LONG_CLASS);
    expect(screen.getByRole('link', { name: 'short' }).className).not.toMatch(LONG_CLASS);
  });
});
