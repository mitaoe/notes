import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FOLDER_MIME_TYPE, MAX_SEARCH_LENGTH } from '../../shared/drive.ts';
import { Layout } from '../components/Layout.tsx';
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

const renderInLayout = (route: string) =>
  renderWithProviders(
    <Layout>
      <SearchPage />
    </Layout>,
    route,
  );

describe('SearchPage', () => {
  it('opens a folder from the results at its real path', async () => {
    stubApi(Response.json({ path: '/fy/00_journals' }));
    renderWithProviders(<SearchPage />, '/search?q=journals');

    const folder = await screen.findByRole('button', { name: '00_journals' });
    expect(document.title).toBe('Search: journals | MITAOE Notes');
    await userEvent.click(folder);

    await vi.waitFor(() =>
      expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/fy/00_journals'),
    );
  });

  it("says on the row when the folder can't be opened here", async () => {
    stubApi(Response.json({ error: 'Folder not found' }, { status: 404 }));
    renderWithProviders(<SearchPage />, '/search?q=journals');

    await userEvent.click(await screen.findByRole('button', { name: '00_journals' }));

    expect(await screen.findByText("This folder can't be opened here.")).toBeInTheDocument();
    expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/search?q=journals');
  });

  it('says on the row when opening the folder fails, and retries on the next click', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const answers = [
      Response.json({ error: 'Something went wrong' }, { status: 500 }),
      Response.json({ path: '/fy/00_journals' }),
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = input instanceof Request ? input.url : input.toString();
        return url.startsWith('/api/path')
          ? (answers.shift() ?? Response.error())
          : Response.json(results);
      }),
    );
    renderWithProviders(<SearchPage />, '/search?q=journals');
    const folder = await screen.findByRole('button', { name: '00_journals' });

    await userEvent.click(folder);
    expect(
      await screen.findByText('This folder could not be opened. Please try again.'),
    ).toBeInTheDocument();
    await userEvent.click(folder);

    await vi.waitFor(() =>
      expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/fy/00_journals'),
    );
  });

  it('shows that the folder is opening', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = input instanceof Request ? input.url : input.toString();
        return url.startsWith('/api/path')
          ? new Promise<Response>(() => {})
          : Response.json(results);
      }),
    );
    renderWithProviders(<SearchPage />, '/search?q=journals');
    const folder = await screen.findByRole('button', { name: '00_journals' });

    await userEvent.click(folder);

    expect(await screen.findByText('Opening…')).toBeInTheDocument();
    expect(folder).toHaveAttribute('aria-busy', 'true');
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
    expect(screen.queryByText('Looks rather empty here')).not.toBeInTheDocument();
  });

  it('explains the length limit for a search link that is too long', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json(results));
    vi.stubGlobal('fetch', fetchMock);
    renderInLayout(`/search?q=${'a'.repeat(MAX_SEARCH_LENGTH + 1)}`);

    expect(await screen.findByText(/Searches are limited to 200 characters/)).toBeInTheDocument();
    expect(screen.getByText('Search failed')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search files' })).toHaveValue(
      'a'.repeat(MAX_SEARCH_LENGTH),
    );
    expect(document.title).toBe(`Search: ${'a'.repeat(MAX_SEARCH_LENGTH)} | MITAOE Notes`);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('searches again when the same search is submitted after a failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({ error: 'Something went wrong' }, { status: 500 }))
        .mockResolvedValueOnce(Response.json(results)),
    );
    renderInLayout('/search?q=journals');
    expect(await screen.findByText('Search failed')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), '{Enter}');

    expect(await screen.findByRole('button', { name: '00_journals' })).toBeInTheDocument();
    expect(screen.queryByText('Search failed')).not.toBeInTheDocument();
  });

  it('searches again from the search breadcrumb after a failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({ error: 'Something went wrong' }, { status: 500 }))
        .mockResolvedValueOnce(Response.json(results)),
    );
    renderInLayout('/search?q=journals');
    expect(await screen.findByText('Search failed')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'search' }));

    expect(await screen.findByRole('button', { name: '00_journals' })).toBeInTheDocument();
    expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/search?q=journals');
  });

  it('opens a top-level folder named search when there is no query', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json(results));
    vi.stubGlobal('fetch', fetchMock);
    renderWithProviders(<SearchPage />, '/search');

    expect(await screen.findByRole('link', { name: '00_journals' })).toHaveAttribute(
      'href',
      '/search/00_journals',
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/list?path=%2Fsearch', expect.anything());
  });

  it('drops a pending folder lookup when another search starts', async () => {
    const answers: ((response: Response) => void)[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input, init) => {
        const url = input instanceof Request ? input.url : input.toString();
        if (!url.startsWith('/api/path')) return Response.json(results);
        return new Promise<Response>((resolve, reject) => {
          answers.push(resolve);
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
      }),
    );
    renderInLayout('/search?q=journals');

    await userEvent.click(await screen.findByRole('button', { name: '00_journals' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search files' }), 'x{Enter}');
    await act(async () => answers.at(0)?.(Response.json({ path: '/fy/00_journals' })));

    expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/search?q=journalsx');
  });

  it('shows a failed Load More next to the button, under the results', async () => {
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

    const alert = await screen.findByText('An error occurred while searching. Please try again.');
    expect(
      screen.getAllByText('An error occurred while searching. Please try again.'),
    ).toHaveLength(1);
    expect(screen.getByText('Results for')).toBeInTheDocument();
    expect(screen.queryByText('Search failed')).not.toBeInTheDocument();
    const folder = screen.getByRole('button', { name: '00_journals' });
    const loadMore = screen.getByRole('button', { name: 'Load More' });
    expect(folder.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(alert.compareDocumentPosition(loadMore) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
