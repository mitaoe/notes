const DOT_SEGMENTS = new Set(['.', '..']);

export const isAddressable = (names: readonly string[]) =>
  names.every((name) => !DOT_SEGMENTS.has(name));

export const toFolderPath = (names: readonly string[]) =>
  `/${names.map(encodeURIComponent).join('/')}`;

export const parseFolderPath = (path: string): string[] | null => {
  try {
    return path.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return null;
  }
};
