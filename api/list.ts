import type { ApiError, DrivePage } from '../shared/drive.ts';
import { parseFolderPath } from '../shared/folder-path.ts';
import { listFolder } from './_lib/drive.ts';
import { CACHE_CONTROL, handleGet, json, optionalParam } from './_lib/http.ts';

export const GET = handleGet(async (params) => {
  const names = parseFolderPath(params.get('path') ?? '/');
  const page = names === null ? null : await listFolder(names, optionalParam(params, 'pageToken'));
  if (page === null) return json<ApiError>({ error: 'Folder not found' }, 404, CACHE_CONTROL.listing);
  return json<DrivePage>(page, 200, CACHE_CONTROL.listing);
});
