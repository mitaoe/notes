import * as v from 'valibot';

import { DrivePageSchema, FolderPathSchema } from '../../shared/drive.ts';
import { StatusError } from '../../shared/status-error.ts';

export class ApiRequestError extends StatusError {}

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
  if (!response.ok)
    throw new ApiRequestError(response.status, `${path} answered ${response.status}`);
  return v.parse(schema, await response.json());
};

const nullIfNotFound = async <T>(response: Promise<T>) => {
  try {
    return await response;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
};

export const fetchFolder = (path: string, pageToken: string | null, signal: AbortSignal | null) =>
  nullIfNotFound(request('/api/list', { path, pageToken }, signal, DrivePageSchema));

export const fetchSearch = (query: string, pageToken: string | null, signal: AbortSignal | null) =>
  request('/api/search', { q: query, pageToken }, signal, DrivePageSchema);

export const downloadHref = (fileId: string) =>
  `/api/download?${new URLSearchParams({ id: fileId })}`;

export const previewHref = (fileId: string) =>
  `/api/preview?${new URLSearchParams({ id: fileId })}`;

export const fetchFolderPath = async (folderId: string, signal: AbortSignal | null) => {
  const folderPath = await nullIfNotFound(
    request('/api/path', { id: folderId }, signal, FolderPathSchema),
  );
  return folderPath?.path ?? null;
};
