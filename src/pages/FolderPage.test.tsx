import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PDF_MIME_TYPE } from '../../shared/drive.ts';
import { Layout } from '../components/Layout.tsx';
import { renderWithProviders } from '../test/render.tsx';
import { FolderPage } from './FolderPage.tsx';

const pdf = (id: string) => ({ id, name: `${id}.pdf`, mimeType: PDF_MIME_TYPE, size: 1 });

const listing = {
  files: [{ id: 'syllabus', name: 'syllabus.pdf', mimeType: PDF_MIME_TYPE, size: 1024 }],
  nextPageToken: null,
};

describe('FolderPage', () => {
  it('shows the not found page for a folder that does not exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json({ error: 'Folder not found' }, { status: 404 }),
      ),
    );
    renderWithProviders(<FolderPage />, '/not-a-real-folder');

    expect(await screen.findByRole('link', { name: 'Back to Home' })).toBeInTheDocument();
    expect(screen.queryByText('Looks rather empty here')).not.toBeInTheDocument();
  });

  it('previews the first PDF of the next page from the last loaded one', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) =>
        Response.json(
          (input instanceof Request ? input.url : input.toString()).includes('pageToken')
            ? { files: [pdf('second')], nextPageToken: null }
            : { files: [pdf('first')], nextPageToken: 'next' },
        ),
      ),
    );
    renderWithProviders(<FolderPage />, '/fy');

    await userEvent.click(await screen.findByTitle('Preview'));
    await userEvent.click(screen.getByRole('button', { name: 'Next file' }));

    expect(await screen.findByTitle('second.pdf')).toHaveAttribute('src', '/api/preview?id=second');
    expect(screen.getByRole('button', { name: 'Next file' })).toBeDisabled();
  });

  it('skips pages without PDFs when moving to the next PDF', async () => {
    const image = { id: 'photo', name: 'photo.png', mimeType: 'image/png', size: 1 };
    const pages: Record<string, unknown> = {
      first: { files: [pdf('first')], nextPageToken: 'images' },
      images: { files: [image], nextPageToken: 'last' },
      last: { files: [pdf('last')], nextPageToken: null },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(input instanceof Request ? input.url : input.toString(), 'http://x');
        return Response.json(pages[url.searchParams.get('pageToken') ?? 'first']);
      }),
    );
    renderWithProviders(<FolderPage />, '/fy');

    await userEvent.click(await screen.findByTitle('Preview'));
    await userEvent.click(screen.getByRole('button', { name: 'Next file' }));

    expect(await screen.findByTitle('last.pdf')).toBeInTheDocument();
  });

  it('says in the preview when the next page fails to load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) =>
        (input instanceof Request ? input.url : input.toString()).includes('pageToken')
          ? Response.json({ error: 'Something went wrong' }, { status: 500 })
          : Response.json({ files: [pdf('first')], nextPageToken: 'next' }),
      ),
    );
    renderWithProviders(<FolderPage />, '/fy');

    await userEvent.click(await screen.findByTitle('Preview'));
    await userEvent.click(screen.getByRole('button', { name: 'Next file' }));

    expect(
      await screen.findByText("Couldn't load more files. Please try again."),
    ).toBeInTheDocument();
  });

  it('loads the folder again from its breadcrumb after a failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({ error: 'Something went wrong' }, { status: 500 }))
        .mockResolvedValueOnce(Response.json(listing)),
    );
    renderWithProviders(
      <Layout>
        <FolderPage />
      </Layout>,
      '/fy',
    );
    expect(await screen.findByText(/error occurred while loading this folder/)).toBeInTheDocument();
    expect(screen.queryByText('Looks rather empty here')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'fy' }));

    expect(await screen.findByText('syllabus.pdf')).toBeInTheDocument();
    expect(screen.queryByText(/error occurred while loading this folder/)).not.toBeInTheDocument();
  });
});
