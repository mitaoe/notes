import * as v from 'valibot';

import { DrivePageSchema, FolderPathSchema } from '../../shared/drive.ts';
import { StatusError } from '../../shared/status-error.ts';

export class ApiRequestError extends StatusError {}

export class RejectedPageTokenError extends Error {
  readonly pageToken: string;

  constructor(pageToken: string, options: ErrorOptions) {
    super('The page token was rejected', options);
    this.name = new.target.name;
    this.pageToken = pageToken;
  }
}

export type PageRequest = { pageToken: string | null; rejectedToken: string | null };

export const FIRST_PAGE: PageRequest = { pageToken: null, rejectedToken: null };

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

const requestPage = async (
  path: string,
  params: Record<string, string>,
  { pageToken, rejectedToken }: PageRequest,
  signal: AbortSignal | null,
) => {
  try {
    return await request(
      path,
      { ...params, pageToken, rejected: rejectedToken },
      signal,
      DrivePageSchema,
    );
  } catch (error) {
    if (pageToken !== null && error instanceof ApiRequestError && error.status === 400) {
      throw new RejectedPageTokenError(pageToken, { cause: error });
    }
    throw error;
  }
};

export const fetchFolder = (path: string, page: PageRequest, signal: AbortSignal | null) =>
  nullIfNotFound(requestPage('/api/list', { path }, page, signal));

export const fetchSearch = (query: string, page: PageRequest, signal: AbortSignal | null) =>
  requestPage('/api/search', { q: query }, page, signal);

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
