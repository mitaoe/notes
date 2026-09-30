import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { DriveItem } from '../../shared/drive.ts';
import { renderWithProviders } from '../test/render.tsx';
import { FilePreview } from './FilePreview.tsx';

const pdf = (id: string): DriveItem => ({
  id,
  name: `${id}.pdf`,
  mimeType: 'application/pdf',
  size: 1,
});
const files = [pdf('a'), pdf('b'), pdf('c')];

const setup = (file: DriveItem) => {
  const handlers = { onSelect: vi.fn<(file: DriveItem) => void>(), onClose: vi.fn<() => void>() };
  renderWithProviders(<FilePreview file={file} files={files} {...handlers} />);
  return handlers;
};

describe('FilePreview', () => {
  it('loads the preview endpoint in a sandboxed frame', () => {
    setup(pdf('b'));
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

  it('closes with the button and Escape', async () => {
    const { onClose } = setup(pdf('a'));
    await userEvent.click(screen.getByRole('button', { name: 'Close preview' }));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
