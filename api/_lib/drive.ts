import { FOLDER_MIME_TYPE, type DriveItem, type DrivePage } from '../../shared/drive.ts';
import { toFolderPath } from '../../shared/folder-path.ts';
import { GoogleApiError, driveGet, drivePost } from './google.ts';

export const PAGE_SIZE = 10;

const ROOT_FOLDER_ID = 'root';
const HIDDEN_FILE_NAME = '.password';
const HIDDEN_MIME_TYPES = [
  'application/vnd.google-apps.shortcut',
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.form',
  'application/vnd.google-apps.site',
];
const LIST_FIELDS = 'nextPageToken, files(id, name, mimeType, size)';
const METADATA_FIELDS = 'id, name, mimeType, trashed, parents, permissionIds';
const LIST_ORDER = 'folder,name,modifiedTime desc';
const PUBLIC_LINK_PERMISSION_ID = 'anyoneWithLink';
const SEARCH_TERM_SEPARATORS = /[\s,，|(){}]+/;
const FOLDER_ID_TTL_MS = 5 * 60_000;
const MAX_FOLDER_DEPTH = 32;

type DriveFile = { id: string; name: string; mimeType: string; size?: string };
type DriveFileList = { files: DriveFile[]; nextPageToken?: string };
type DriveMetadata = DriveFile & { trashed: boolean; parents?: string[]; permissionIds?: string[] };

const ALL_DRIVES = { supportsAllDrives: true, includeItemsFromAllDrives: true, corpora: 'allDrives' };

export const quote = (value: string) => `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

const VISIBLE_ITEMS = [
  'trashed = false',
  `name != ${quote(HIDDEN_FILE_NAME)}`,
  ...HIDDEN_MIME_TYPES.map((mimeType) => `mimeType != ${quote(mimeType)}`),
].join(' and ');

export const folderContentsQuery = (folderId: string) => `${quote(folderId)} in parents and ${VISIBLE_ITEMS}`;

export const searchQuery = (text: string) => {
  const terms = text.split(SEARCH_TERM_SEPARATORS).filter(Boolean);
  if (terms.length === 0) return null;
  return [VISIBLE_ITEMS, ...terms.map((term) => `name contains ${quote(term)}`)].join(' and ');
};

const toDriveItem = ({ id, name, mimeType, size }: DriveFile): DriveItem => ({
  id,
  name,
  mimeType,
  size: size === undefined ? null : Number(size),
});

const listFiles = async (q: string, pageToken: string | null): Promise<DrivePage> => {
  const result = await driveGet<DriveFileList>('/files', {
    ...ALL_DRIVES,
    q,
    orderBy: LIST_ORDER,
    fields: LIST_FIELDS,
    pageSize: PAGE_SIZE,
    ...(pageToken === null ? {} : { pageToken }),
  });
  return { files: result.files.map(toDriveItem), nextPageToken: result.nextPageToken ?? null };
};

const folderIds = new Map<string, { id: string; expiresAt: number }>();

const findChildFolderId = async (parentId: string, name: string) => {
  const key = `${parentId}/${name}`;
  const cached = folderIds.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.id;

  const result = await driveGet<DriveFileList>('/files', {
    ...ALL_DRIVES,
    q: `${quote(parentId)} in parents and name = ${quote(name)} and mimeType = ${quote(FOLDER_MIME_TYPE)} and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
  });
  const id = result.files[0]?.id ?? null;
  if (id !== null) folderIds.set(key, { id, expiresAt: Date.now() + FOLDER_ID_TTL_MS });
  return id;
};

const resolveFolderId = async (names: readonly string[]) => {
  let folderId: string | null = ROOT_FOLDER_ID;
  for (const name of names) {
    folderId = await findChildFolderId(folderId, name);
    if (folderId === null) return null;
  }
  return folderId;
};

export const listFolder = async (names: readonly string[], pageToken: string | null) => {
  const folderId = await resolveFolderId(names);
  return folderId === null ? null : listFiles(folderContentsQuery(folderId), pageToken);
};

export const searchFiles = async (text: string, pageToken: string | null): Promise<DrivePage> => {
  const q = searchQuery(text);
  return q === null ? { files: [], nextPageToken: null } : listFiles(q, pageToken);
};

const getMetadata = async (id: string) => {
  try {
    return await driveGet<DriveMetadata>(`/files/${encodeURIComponent(id)}`, {
      fields: METADATA_FIELDS,
      supportsAllDrives: true,
    });
  } catch (error) {
    if (error instanceof GoogleApiError && error.status === 404) return null;
    throw error;
  }
};

let rootFolderId: Promise<string> | null = null;

const getRootFolderId = () => {
  rootFolderId ??= driveGet<{ id: string }>(`/files/${ROOT_FOLDER_ID}`, { fields: 'id' }).then(
    ({ id }) => id,
    (error: unknown) => {
      rootFolderId = null;
      throw error;
    },
  );
  return rootFolderId;
};

export const findFolderPath = async (folderId: string) => {
  const rootId = await getRootFolderId();
  const names: string[] = [];
  let folder = await getMetadata(folderId);

  while (folder !== null && folder.mimeType === FOLDER_MIME_TYPE && !folder.trashed && names.length < MAX_FOLDER_DEPTH) {
    names.unshift(folder.name);
    const parentId = folder.parents?.[0];
    if (parentId === undefined) return null;
    if (parentId === rootId) return toFolderPath(names);
    folder = await getMetadata(parentId);
  }
  return null;
};

const isVisibleFile = (file: DriveMetadata) =>
  !file.trashed &&
  file.name !== HIDDEN_FILE_NAME &&
  file.mimeType !== FOLDER_MIME_TYPE &&
  !HIDDEN_MIME_TYPES.includes(file.mimeType);

export const shareFile = async (fileId: string) => {
  const file = await getMetadata(fileId);
  if (file === null || !isVisibleFile(file)) return false;
  if (!file.permissionIds?.includes(PUBLIC_LINK_PERMISSION_ID)) {
    await drivePost(`/files/${encodeURIComponent(fileId)}/permissions`, { supportsAllDrives: true }, { role: 'reader', type: 'anyone' });
  }
  return true;
};

export const downloadUrl = (fileId: string) => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;

export const previewUrl = (fileId: string) => `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
