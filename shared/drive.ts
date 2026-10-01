import * as v from 'valibot';

export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
export const PDF_MIME_TYPE = 'application/pdf';
export const MAX_SEARCH_LENGTH = 200;
export const FILE_LINK_ERROR_TITLE = 'File unavailable';

const TRAILING_HIGH_SURROGATE = /[\uD800-\uDBFF]$/;

export const limitSearch = (text: string) => {
  const limited = text.slice(0, MAX_SEARCH_LENGTH);
  return TRAILING_HIGH_SURROGATE.test(limited) ? limited.slice(0, -1) : limited;
};

const DriveItemSchema = v.object({
  id: v.string(),
  name: v.string(),
  mimeType: v.string(),
  size: v.nullable(v.number()),
});

export const DrivePageSchema = v.object({
  files: v.array(DriveItemSchema),
  nextPageToken: v.nullable(v.string()),
});

export const FolderPathSchema = v.object({
  path: v.string(),
});

const ApiErrorSchema = v.object({
  error: v.string(),
});

export type DriveItem = v.InferOutput<typeof DriveItemSchema>;
export type DrivePage = v.InferOutput<typeof DrivePageSchema>;
type FolderPath = v.InferOutput<typeof FolderPathSchema>;
type ApiError = v.InferOutput<typeof ApiErrorSchema>;
export type ApiBody = DrivePage | FolderPath | ApiError;

export const isFolder = (item: Pick<DriveItem, 'mimeType'>) => item.mimeType === FOLDER_MIME_TYPE;

export const isPdf = (item: Pick<DriveItem, 'mimeType'>) => item.mimeType === PDF_MIME_TYPE;
