import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FOLDER_MIME_TYPE, PDF_MIME_TYPE, type DriveItem } from '../../shared/drive.ts';
import { renderWithProviders } from '../test/render.tsx';
import { FileRow } from './FileRow.tsx';

const folder: DriveItem = { id: 'f1', name: 'fy', mimeType: FOLDER_MIME_TYPE, size: null };
const pdf: DriveItem = { id: 'p1', name: 'notes.pdf', mimeType: PDF_MIME_TYPE, size: 1701326 };
const image: DriveItem = { id: 'i1', name: 'lab.png', mimeType: 'image/png', size: 0 };

const setup = (file: DriveItem) => {
  const onOpen = vi.fn<(folder: DriveItem) => void>();
  const onPreview = vi.fn<(file: DriveItem) => void>();
  renderWithProviders(
    <FileRow file={file} folderOpener={{ onOpen, opening: null }} onPreview={onPreview} />,
  );
  return { onOpen, onPreview };
};

describe('FileRow', () => {
  it('opens folders through the callback', async () => {
    const { onOpen } = setup(folder);
    await userEvent.click(screen.getByRole('button', { name: 'fy' }));
    expect(onOpen).toHaveBeenCalledWith(folder);
    expect(screen.queryByTitle('Download')).not.toBeInTheDocument();
  });

  it('links folders when their path is known', () => {
    renderWithProviders(
      <FileRow
        file={folder}
        folderOpener={{ href: (target) => `/${target.name}` }}
        onPreview={vi.fn<(file: DriveItem) => void>()}
      />,
    );
    expect(screen.getByRole('link', { name: 'fy' })).toHaveAttribute('href', '/fy');
  });

  it('shows size, preview and download for PDFs', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { onPreview } = setup(pdf);

    expect(screen.getByText('1.62 MB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview notes.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download notes.pdf' })).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Preview'));
    expect(onPreview).toHaveBeenCalledWith(pdf);
    await userEvent.click(screen.getByTitle('Download'));
    expect(open).toHaveBeenCalledWith('/api/download?id=p1', '_blank', 'noopener');
  });

  it('offers only download for other files and hides empty sizes', () => {
    setup(image);
    expect(screen.queryByTitle('Preview')).not.toBeInTheDocument();
    expect(screen.getByTitle('Download')).toBeInTheDocument();
    expect(screen.queryByText('0 B')).not.toBeInTheDocument();
  });
});
