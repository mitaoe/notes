import * as v from 'valibot';
import { DrivePageSchema, FolderPathSchema, type DrivePage } from '../../shared/drive.ts';

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

const EMPTY_PAGE: DrivePage = { files: [], nextPageToken: null };

const request = async <TSchema extends v.GenericSchema>(
  path: string,
  params: Record<string, string | null>,
  signal: AbortSignal | null,
  schema: TSchema,
) => {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== null) query.set(name, value);
  }
  const response = await fetch(`${path}?${query}`, { signal });
  if (!response.ok) throw new ApiRequestError(response.status, `${path} answered ${response.status}`);
  return v.parse(schema, await response.json());
};

export const fetchFolder = async (path: string, pageToken: string | null, signal: AbortSignal | null) => {
  try {
    return await request('/api/list', { path, pageToken }, signal, DrivePageSchema);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return EMPTY_PAGE;
    throw error;
  }
};

export const fetchSearch = (query: string, pageToken: string | null, signal: AbortSignal | null) =>
  request('/api/search', { q: query, pageToken }, signal, DrivePageSchema);

export const downloadHref = (fileId: string) => `/api/download?${new URLSearchParams({ id: fileId })}`;

export const previewHref = (fileId: string) => `/api/preview?${new URLSearchParams({ id: fileId })}`;

export const fetchFolderPath = async (folderId: string) =>
  (await request('/api/path', { id: folderId }, null, FolderPathSchema)).path;
