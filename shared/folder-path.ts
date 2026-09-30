export const toFolderPath = (names: readonly string[]) => `/${names.map(encodeURIComponent).join('/')}`;

export const parseFolderPath = (path: string): string[] | null => {
  try {
    return path.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return null;
  }
};
