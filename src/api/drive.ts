import type { DrivePage, FolderPath } from '../../shared/drive.ts';

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

const EMPTY_PAGE: DrivePage = { files: [], nextPageToken: null };

const request = async <T>(path: string, params: Record<string, string | null>, signal: AbortSignal | null) => {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== null) query.set(name, value);
  }
  const response = await fetch(`${path}?${query}`, { signal });
  if (!response.ok) throw new ApiRequestError(response.status, `${path} answered ${response.status}`);
  return (await response.json()) as T;
};

export const fetchFolder = async (path: string, pageToken: string | null, signal: AbortSignal | null) => {
  try {
    return await request<DrivePage>('/api/list', { path, pageToken }, signal);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return EMPTY_PAGE;
    throw error;
  }
};

export const fetchSearch = (query: string, pageToken: string | null, signal: AbortSignal | null) =>
  request<DrivePage>('/api/search', { q: query, pageToken }, signal);

export const downloadHref = (fileId: string) => `/api/download?${new URLSearchParams({ id: fileId })}`;

export const previewHref = (fileId: string) => `/api/preview?${new URLSearchParams({ id: fileId })}`;

export const fetchFolderPath = async (folderId: string) => (await request<FolderPath>('/api/path', { id: folderId }, null)).path;
