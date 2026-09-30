import type { ApiError, FolderPath } from '../shared/drive.ts';
import { findFolderPath } from './_lib/drive.ts';
import { CACHE_CONTROL, driveIdParam, handleGet, json } from './_lib/http.ts';

export const GET = handleGet(async (params) => {
  const path = await findFolderPath(driveIdParam(params));
  if (path === null) return json<ApiError>({ error: 'Folder not found' }, 404, CACHE_CONTROL.folderPath);
  return json<FolderPath>({ path }, 200, CACHE_CONTROL.folderPath);
});
