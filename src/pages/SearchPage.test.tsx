import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FOLDER_MIME_TYPE } from '../../shared/drive.ts';
import { LOCATION_TEST_ID } from '../test/CurrentLocation.tsx';
import { renderWithProviders } from '../test/render.tsx';
import { SearchPage } from './SearchPage.tsx';

const results = {
  files: [{ id: 'journals', name: '00_journals', mimeType: FOLDER_MIME_TYPE, size: null }],
  nextPageToken: null,
};

const stubApi = (pathResponse: Response) =>
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (input) => {
      const url = input instanceof Request ? input.url : input.toString();
      return url.startsWith('/api/path') ? pathResponse : Response.json(results);
    }),
  );

describe('SearchPage', () => {
  it('opens a folder from the results at its real path', async () => {
    stubApi(Response.json({ path: '/fy/00_journals' }));
    renderWithProviders(<SearchPage />, '/search?q=journals');

    await userEvent.click(await screen.findByRole('button', { name: '00_journals' }));

    await vi.waitFor(() =>
      expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/fy/00_journals'),
    );
  });

  it('falls back to the not found page when the folder cannot be resolved', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubApi(Response.json({ error: 'Folder not found' }, { status: 404 }));
    renderWithProviders(<SearchPage />, '/search?q=journals');

    await userEvent.click(await screen.findByRole('button', { name: '00_journals' }));

    await vi.waitFor(() => expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/404'));
  });

  it('shows the error state when the search fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json({ error: 'Something went wrong' }, { status: 500 }),
      ),
    );
    renderWithProviders(<SearchPage />, '/search?q=journals');

    expect(await screen.findByText('Search failed')).toBeInTheDocument();
    expect(
      screen.getByText('An error occurred while searching. Please try again.'),
    ).toBeInTheDocument();
  });

  it('keeps the results title when loading more fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = input instanceof Request ? input.url : input.toString();
        return url.includes('pageToken')
          ? Response.json({ error: 'Something went wrong' }, { status: 500 })
          : Response.json({ ...results, nextPageToken: 'next' });
      }),
    );
    renderWithProviders(<SearchPage />, '/search?q=journals');

    await userEvent.click(await screen.findByRole('button', { name: 'Load More' }));

    expect(
      await screen.findByText('An error occurred while searching. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Results for')).toBeInTheDocument();
    expect(screen.queryByText('Search failed')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '00_journals' })).toBeInTheDocument();
  });
});
