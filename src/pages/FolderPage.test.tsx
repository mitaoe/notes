import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PDF_MIME_TYPE } from '../../shared/drive.ts';
import { Layout } from '../components/Layout.tsx';
import { renderWithProviders } from '../test/render.tsx';
import { FolderPage } from './FolderPage.tsx';

const listing = {
  files: [{ id: 'syllabus', name: 'syllabus.pdf', mimeType: PDF_MIME_TYPE, size: 1024 }],
  nextPageToken: null,
};

describe('FolderPage', () => {
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

    await userEvent.click(screen.getByRole('link', { name: 'fy' }));

    expect(await screen.findByText('syllabus.pdf')).toBeInTheDocument();
    expect(screen.queryByText(/error occurred while loading this folder/)).not.toBeInTheDocument();
  });
});
