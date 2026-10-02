import { parseFolderPath } from '../shared/folder-path.ts';
import { listFolder } from './_lib/drive.ts';
import { CACHE_CONTROL, HttpError, handleGet, json, optionalParam } from './_lib/http.ts';

export const GET = handleGet(async (params) => {
  const names = parseFolderPath(optionalParam(params, 'path') ?? '/');
  const page = names === null ? null : await listFolder(names, optionalParam(params, 'pageToken'));
  if (page === null) throw new HttpError(404, 'Folder not found', CACHE_CONTROL.listing);
  return json(page, 200, CACHE_CONTROL.listing);
});
