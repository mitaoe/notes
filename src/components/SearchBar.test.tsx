import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../test/render.tsx';
import { SearchBar } from './SearchBar.tsx';

const setup = (query: string) => {
  const handlers = {
    onQueryChange: vi.fn<(query: string) => void>(),
    onSearch: vi.fn<() => void>(),
    onClear: vi.fn<() => void>(),
  };
  renderWithProviders(<SearchBar query={query} {...handlers} />);
  return handlers;
};

describe('SearchBar', () => {
  it('reports typed text', async () => {
    const { onQueryChange } = setup('');
    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), 'u');
    expect(onQueryChange).toHaveBeenCalledWith('u');
  });

  it('searches on submit when there is a query', async () => {
    const { onSearch } = setup('unit');
    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), '{Enter}');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('does not search for blank input', async () => {
    const { onSearch } = setup('   ');
    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), '{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('shows the clear button only with a query', async () => {
    const { onClear } = setup('unit');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('hides the clear button when empty', () => {
    setup('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });
});
