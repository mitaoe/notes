import * as v from 'valibot';

import { FOLDER_MIME_TYPE, isFolder, type DriveItem, type DrivePage } from '../../shared/drive.ts';
import { isAddressable, toFolderPath } from '../../shared/folder-path.ts';
import { GoogleApiError, driveGet, drivePost } from './google.ts';
import { HttpError } from './http.ts';

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
const ID_LIST_FIELDS = 'files(id)';
const ID_FIELDS = 'id';
const METADATA_FIELDS =
  'id, name, mimeType, trashed, parents, permissionIds, capabilities/canShare';
const LIST_ORDER = 'folder,name,modifiedTime desc';
const FOLDER_LOOKUP_ORDER = 'createdTime';
const PUBLIC_PERMISSION_IDS = new Set(['anyoneWithLink', 'anyone']);
const SEARCH_IGNORED_CHARACTERS = /!=|["=<>/\\:]/g;
const SEARCH_TERM_SEPARATORS = /[\s,，|(){}]+/;
const FOLDER_ID_TTL_MS = 5 * 60_000;
const MAX_FOLDER_DEPTH = 32;

const DriveFileSchema = v.object({
  id: v.string(),
  name: v.string(),
  mimeType: v.string(),
  size: v.optional(v.string()),
});

const DriveFileListSchema = v.object({
  files: v.array(DriveFileSchema),
  nextPageToken: v.optional(v.string()),
});

const DriveMetadataSchema = v.object({
  ...DriveFileSchema.entries,
  trashed: v.boolean(),
  parents: v.optional(v.array(v.string())),
  permissionIds: v.optional(v.array(v.string())),
  capabilities: v.object({ canShare: v.boolean() }),
});

const DriveIdSchema = v.object({ id: v.string() });

type DriveFile = v.InferOutput<typeof DriveFileSchema>;
type DriveMetadata = v.InferOutput<typeof DriveMetadataSchema>;

const WITH_SHARED_DRIVES = { supportsAllDrives: true, includeItemsFromAllDrives: true };
const ALL_DRIVES = { ...WITH_SHARED_DRIVES, corpora: 'allDrives' };

export const quote = (value: string) =>
  `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

const VISIBLE_ITEMS = [
  'trashed = false',
  `name != ${quote(HIDDEN_FILE_NAME)}`,
  ...HIDDEN_MIME_TYPES.map((mimeType) => `mimeType != ${quote(mimeType)}`),
].join(' and ');

const folderContentsQuery = (folderId: string) =>
  `${quote(folderId)} in parents and ${VISIBLE_ITEMS}`;

export const searchQuery = (text: string) => {
  const terms = text
    .replace(SEARCH_IGNORED_CHARACTERS, '')
    .split(SEARCH_TERM_SEPARATORS)
    .filter(Boolean);
  if (terms.length === 0) return null;
  return [VISIBLE_ITEMS, ...terms.map((term) => `name contains ${quote(term)}`)].join(' and ');
};

const toDriveItem = ({ id, name, mimeType, size }: DriveFile): DriveItem => ({
  id,
  name,
  mimeType,
  size: size === undefined ? null : Number(size),
});

const rejectedPageToken = () => new HttpError(400, 'pageToken is invalid');

const listFiles = async (q: string, pageToken: string | null): Promise<DrivePage> => {
  const params = {
    ...ALL_DRIVES,
    q,
    orderBy: LIST_ORDER,
    fields: LIST_FIELDS,
    pageSize: PAGE_SIZE,
  };
  try {
    const result = await driveGet(
      '/files',
      pageToken === null ? params : { ...params, pageToken },
      DriveFileListSchema,
    );
    return { files: result.files.map(toDriveItem), nextPageToken: result.nextPageToken ?? null };
  } catch (error) {
    if (pageToken !== null && error instanceof GoogleApiError && error.status === 400) {
      throw rejectedPageToken();
    }
    throw error;
  }
};

const folderIds = new Map<string, { id: string; expiresAt: number }>();

type FolderResolution = { id: string | null; remembered: boolean };

const lookUpChildFolderId = async (parentId: string, name: string) => {
  const result = await driveGet(
    '/files',
    {
      ...WITH_SHARED_DRIVES,
      q: `${quote(parentId)} in parents and name = ${quote(name)} and mimeType = ${quote(FOLDER_MIME_TYPE)} and trashed = false`,
      fields: ID_LIST_FIELDS,
      orderBy: FOLDER_LOOKUP_ORDER,
      pageSize: 1,
    },
    v.object({ files: v.array(DriveIdSchema) }),
  );
  return result.files[0]?.id ?? null;
};

const folderResolver = () => {
  const lookedUp = new Map<string, string | null>();

  const findChild = async (
    parentId: string,
    name: string,
    useMemory: boolean,
  ): Promise<FolderResolution> => {
    const key = `${parentId}/${name}`;
    if (lookedUp.has(key)) return { id: lookedUp.get(key) ?? null, remembered: false };
    const remembered = folderIds.get(key);
    if (useMemory && remembered && remembered.expiresAt > Date.now()) {
      return { id: remembered.id, remembered: true };
    }
    const id = await lookUpChildFolderId(parentId, name);
    lookedUp.set(key, id);
    if (id === null) folderIds.delete(key);
    else folderIds.set(key, { id, expiresAt: Date.now() + FOLDER_ID_TTL_MS });
    return { id, remembered: false };
  };

  const resolve = (names: readonly string[], useMemory: boolean) =>
    names.reduce<Promise<FolderResolution>>(
      async (parent, name) => {
        const resolved = await parent;
        if (resolved.id === null) return resolved;
        const child = await findChild(resolved.id, name, useMemory);
        return { id: child.id, remembered: resolved.remembered || child.remembered };
      },
      Promise.resolve({ id: ROOT_FOLDER_ID, remembered: false }),
    );

  const confirm = async (names: readonly string[], resolution: FolderResolution) =>
    resolution.remembered ? (await resolve(names, false)).id : resolution.id;

  return { resolve, confirm };
};

export const listFolder = async (names: readonly string[], pageToken: string | null) => {
  const folders = folderResolver();
  const resolution = await folders.resolve(names, true);
  const folderId = resolution.id ?? (await folders.confirm(names, resolution));
  if (folderId === null) return null;
  const page = await listFiles(folderContentsQuery(folderId), pageToken);
  if (page.files.length > 0 || resolution.id === null) return page;
  const currentId = await folders.confirm(names, resolution);
  if (currentId === folderId) return page;
  if (currentId === null) return null;
  if (pageToken !== null) throw rejectedPageToken();
  return listFiles(folderContentsQuery(currentId), null);
};

export const searchFiles = async (text: string, pageToken: string | null): Promise<DrivePage> => {
  const q = searchQuery(text);
  return q === null ? { files: [], nextPageToken: null } : listFiles(q, pageToken);
};

const getMetadata = async (id: string) => {
  try {
    return await driveGet(
      `/files/${encodeURIComponent(id)}`,
      { fields: METADATA_FIELDS, supportsAllDrives: true },
      DriveMetadataSchema,
    );
  } catch (error) {
    if (error instanceof GoogleApiError && error.status === 404) return null;
    throw error;
  }
};

let rootFolderId: Promise<string> | null = null;

const getRootFolderId = () => {
  rootFolderId ??= driveGet(`/files/${ROOT_FOLDER_ID}`, { fields: ID_FIELDS }, DriveIdSchema).then(
    ({ id }) => id,
    (error: unknown) => {
      rootFolderId = null;
      throw error;
    },
  );
  return rootFolderId;
};

const isLiveFolder = (item: DriveMetadata | null): item is DriveMetadata =>
  item !== null && isFolder(item) && !item.trashed;

const collectFolderNames = async (
  folderId: string,
  rootId: string,
  names: readonly string[],
): Promise<string[] | null> => {
  const folder = await getMetadata(folderId);
  if (!isLiveFolder(folder) || names.length >= MAX_FOLDER_DEPTH) return null;
  const path = [folder.name, ...names];
  const parentId = folder.parents?.[0];
  if (parentId === undefined) return null;
  return parentId === rootId ? path : collectFolderNames(parentId, rootId, path);
};

export const findFolderPath = async (folderId: string) => {
  const names = await collectFolderNames(folderId, await getRootFolderId(), []);
  if (names === null || !isAddressable(names)) return null;
  const folders = folderResolver();
  const resolution = await folders.resolve(names, true);
  const leadsHere =
    resolution.id === folderId || (await folders.confirm(names, resolution)) === folderId;
  return leadsHere ? toFolderPath(names) : null;
};

const isVisibleFile = (file: DriveMetadata) =>
  !file.trashed &&
  file.name !== HIDDEN_FILE_NAME &&
  !isFolder(file) &&
  !HIDDEN_MIME_TYPES.includes(file.mimeType);

const isPublic = (file: DriveMetadata) =>
  file.permissionIds?.some((id) => PUBLIC_PERMISSION_IDS.has(id)) ?? false;

export const shareFile = async (fileId: string) => {
  const file = await getMetadata(fileId);
  if (file === null || !isVisibleFile(file)) return false;
  if (!isPublic(file) && file.capabilities.canShare) {
    await drivePost(
      `/files/${encodeURIComponent(fileId)}/permissions`,
      { supportsAllDrives: true },
      { role: 'reader', type: 'anyone' },
      DriveIdSchema,
    );
  }
  return true;
};

export const downloadUrl = (fileId: string) =>
  `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;

export const previewUrl = (fileId: string) =>
  `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
