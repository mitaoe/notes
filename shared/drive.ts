export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
export const PDF_MIME_TYPE = 'application/pdf';

export type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
};

export type DrivePage = {
  files: DriveItem[];
  nextPageToken: string | null;
};

export type FolderPath = {
  path: string;
};

export type ApiError = {
  error: string;
};

export const isFolder = (item: Pick<DriveItem, 'mimeType'>) => item.mimeType === FOLDER_MIME_TYPE;
