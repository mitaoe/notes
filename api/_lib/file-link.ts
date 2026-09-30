import { shareFile } from './drive.ts';
import { CACHE_CONTROL, HttpError, driveIdParam, handleGet, redirect } from './http.ts';

export const handleFileLink = (toUrl: (fileId: string) => string) =>
  handleGet(async (params) => {
    const fileId = driveIdParam(params);
    if (!(await shareFile(fileId))) throw new HttpError(404, 'File not found');
    return redirect(toUrl(fileId), CACHE_CONTROL.fileLink);
  });
