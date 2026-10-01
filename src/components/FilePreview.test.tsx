import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PDF_MIME_TYPE, type DriveItem } from '../../shared/drive.ts';
import { renderWithProviders } from '../test/render.tsx';
import { FilePreview } from './FilePreview.tsx';

const pdf = (id: string): DriveItem => ({
  id,
  name: `${id}.pdf`,
  mimeType: PDF_MIME_TYPE,
  size: 1,
});
const files = [pdf('a'), pdf('b'), pdf('c')];

const setup = (file: DriveItem, onNextPage: (() => void) | null = null, nextPageFailed = false) => {
  const handlers = { onSelect: vi.fn<(file: DriveItem) => void>(), onClose: vi.fn<() => void>() };
  renderWithProviders(
    <FilePreview
      file={file}
      files={files}
      onNextPage={onNextPage}
      loadingNextPage={false}
      nextPageFailed={nextPageFailed}
      {...handlers}
    />,
  );
  return handlers;
};

describe('FilePreview', () => {
  it('loads the preview endpoint in a sandboxed frame', () => {
    setup(pdf('b'));
    expect(screen.getByRole('dialog', { name: 'Preview of b.pdf' })).toBeInTheDocument();
    const frame = screen.getByTitle('b.pdf');
    expect(frame).toHaveAttribute('src', '/api/preview?id=b');
    expect(frame).toHaveAttribute('sandbox', expect.stringContaining('allow-scripts'));
  });

  it('moves between PDFs with the buttons and arrow keys', async () => {
    const { onSelect } = setup(pdf('b'));

    await userEvent.click(screen.getByRole('button', { name: 'Next file' }));
    expect(onSelect).toHaveBeenLastCalledWith(pdf('c'));
    await userEvent.click(screen.getByRole('button', { name: 'Previous file' }));
    expect(onSelect).toHaveBeenLastCalledWith(pdf('a'));
    await userEvent.keyboard('{ArrowRight}');
    expect(onSelect).toHaveBeenLastCalledWith(pdf('c'));
  });

  it('disables navigation past the ends', async () => {
    const { onSelect } = setup(pdf('a'));
    expect(screen.getByRole('button', { name: 'Previous file' })).toBeDisabled();
    await userEvent.keyboard('{ArrowLeft}');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('disables next on the last PDF when there are no more pages', () => {
    setup(pdf('c'));
    expect(screen.getByRole('button', { name: 'Next file' })).toBeDisabled();
  });

  it('asks for the next page from the last loaded PDF', async () => {
    const onNextPage = vi.fn<() => void>();
    const { onSelect } = setup(pdf('c'), onNextPage);

    await userEvent.click(screen.getByRole('button', { name: 'Next file' }));
    await userEvent.keyboard('{ArrowRight}');

    expect(onNextPage).toHaveBeenCalledTimes(2);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('says when the next page could not be loaded', () => {
    setup(pdf('c'), vi.fn<() => void>(), true);
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't load more files. Please try again.",
    );
  });

  it('closes with the button and Escape', async () => {
    const { onClose } = setup(pdf('a'));
    await userEvent.click(screen.getByRole('button', { name: 'Close preview' }));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
