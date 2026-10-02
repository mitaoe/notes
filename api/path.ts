import { findFolderPath } from './_lib/drive.ts';
import { CACHE_CONTROL, HttpError, driveIdParam, handleGet, json } from './_lib/http.ts';

export const GET = handleGet(async (params) => {
  const path = await findFolderPath(driveIdParam(params));
  if (path === null) throw new HttpError(404, 'Folder not found', CACHE_CONTROL.folderPath);
  return json({ path }, 200, CACHE_CONTROL.folderPath);
});
