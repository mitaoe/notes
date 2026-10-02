import { describe, expect, it } from 'vitest';

import { formatFileSize } from './format.ts';

describe('formatFileSize', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1024, '1 KB'],
    [1701326, '1.62 MB'],
    [15770031, '15.04 MB'],
    [5 * 1024 ** 3, '5 GB'],
    [3 * 1024 ** 5, '3072 TB'],
  ])('formats %d bytes as %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});
