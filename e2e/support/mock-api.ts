import { readFileSync } from 'node:fs';
import type { Page, Route } from '@playwright/test';
import { FOLDER_MIME_TYPE, findById, paginate, searchNodes, sortForListing, type FixtureNode } from '../fixtures/drive';

export const FAILING_QUERY = 'boom';

const logo = readFileSync(new URL('../../public/favicon.ico', import.meta.url));

const toDriveFile = (node: FixtureNode) => ({
  id: node.id,
  name: node.name,
  mimeType: node.mimeType,
  ...(node.size === null ? {} : { size: String(node.size) }),
});

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const handleFiles = (route: Route, params: URLSearchParams) => {
  const pageSize = Number(params.get('pageSize') ?? 100);
  const pageToken = params.get('pageToken');
  const search = params.get('search');
  const fileId = params.get('fileId');
  const folderName = params.get('folderName');
  const parent = findById(params.get('path') ?? 'root');

  if (fileId) {
    const node = findById(fileId);
    if (!node) return json(route, { error: 'File not found' }, 404);
    return json(route, { ...toDriveFile(node), parents: node.parentId ? [node.parentId] : [] });
  }

  if (folderName !== null) {
    const match = parent?.children.filter((child) => child.name === folderName && child.mimeType === FOLDER_MIME_TYPE) ?? [];
    return json(route, { files: match.map(toDriveFile) });
  }

  if (search !== null) {
    if (search === FAILING_QUERY) return json(route, { error: 'Failed to fetch files' }, 500);
    const page = paginate(searchNodes(search), pageToken, pageSize);
    return json(route, { files: page.items.map(toDriveFile), nextPageToken: page.nextPageToken });
  }

  const page = paginate(sortForListing(parent?.children ?? []), pageToken, pageSize);
  return json(route, { files: page.items.map(toDriveFile), nextPageToken: page.nextPageToken });
};

export const mockDriveApi = async (page: Page) => {
  await page.route('**/api/files?**', (route) => handleFiles(route, new URL(route.request().url()).searchParams));
  await page.route('**/api/download?**', (route) => {
    const id = new URL(route.request().url()).searchParams.get('fileId');
    return json(route, {
      downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
      previewUrl: `https://drive.google.com/file/d/${id}/preview`,
    });
  });
  await page.route('https://drive.google.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>preview</title><body style="margin:0;background:#fff"></body>' }),
  );
  await page.route('https://img.icons8.com/**', (route) => route.fulfill({ contentType: 'image/x-icon', body: logo }));
  await page.route('**/_vercel/**', (route) => route.fulfill({ status: 404, body: '' }));
};
