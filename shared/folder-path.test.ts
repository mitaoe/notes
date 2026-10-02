import { describe, expect, it } from 'vitest';

import { isAddressable, parseFolderPath, toFolderPath } from './folder-path.ts';

describe('toFolderPath', () => {
  it('encodes each folder name as its own segment', () => {
    expect(toFolderPath([])).toBe('/');
    expect(toFolderPath(['fy', 'a/b #1'])).toBe('/fy/a%2Fb%20%231');
  });
});

describe('parseFolderPath', () => {
  it('reverses toFolderPath', () => {
    const names = ['fy', "o'reilly & co", 'a/b #1'];
    expect(parseFolderPath(toFolderPath(names))).toEqual(names);
  });

  it('ignores empty segments', () => {
    expect(parseFolderPath('//fy///sy/')).toEqual(['fy', 'sy']);
  });

  it('returns null for malformed escapes', () => {
    expect(parseFolderPath('/%E0%A4%A')).toBeNull();
  });
});

describe('isAddressable', () => {
  it('rejects names a URL treats as dot segments', () => {
    expect(isAddressable(['fy', '...', '.notes'])).toBe(true);
    expect(isAddressable(['fy', '.'])).toBe(false);
    expect(isAddressable(['..', 'notes'])).toBe(false);
  });
});
