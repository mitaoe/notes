import { readFileSync } from 'node:fs';
import type { Page, Route } from '@playwright/test';
import { PAGE_SIZE, downloadUrl } from '../../api/_lib/drive.ts';
import type { DriveItem, DrivePage } from '../../shared/drive.ts';
import { parseFolderPath, toFolderPath } from '../../shared/folder-path.ts';
import { FOLDER_MIME_TYPE, findById, findByPath, paginate, searchNodes, sortForListing, type FixtureNode } from '../fixtures/drive.ts';

export const FAILING_QUERY = 'boom';

const logo = readFileSync(new URL('../../public/favicon.ico', import.meta.url));

const toDriveItem = ({ id, name, mimeType, size }: FixtureNode): DriveItem => ({ id, name, mimeType, size });

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const page = (nodes: FixtureNode[], pageToken: string | null): DrivePage => {
  const { items, nextPageToken } = paginate(nodes, pageToken, PAGE_SIZE);
  return { files: items.map(toDriveItem), nextPageToken };
};

const pathOf = (node: FixtureNode) => {
  const names: string[] = [];
  for (let current: FixtureNode | null = node; current?.parentId; current = findById(current.parentId)) names.unshift(current.name);
  return toFolderPath(names);
};

const PREVIEW_PAGE = '<!doctype html><title>preview</title><body style="margin:0;background:#fff"></body>';

const findFile = (params: URLSearchParams) => {
  const file = findById(params.get('id') ?? '');
  return file === null || file.mimeType === FOLDER_MIME_TYPE ? null : file;
};

const handlers: Record<string, (route: Route, params: URLSearchParams) => Promise<void>> = {
  list: (route, params) => {
    const names = parseFolderPath(params.get('path') ?? '/');
    const folder = names === null ? null : findByPath(names);
    if (folder === null) return json(route, { error: 'Folder not found' }, 404);
    return json(route, page(sortForListing(folder.children), params.get('pageToken')));
  },
  search: (route, params) => {
    const query = params.get('q') ?? '';
    if (query === FAILING_QUERY) return json(route, { error: 'Something went wrong' }, 500);
    return json(route, page(searchNodes(query), params.get('pageToken')));
  },
  path: (route, params) => {
    const folder = findById(params.get('id') ?? '');
    if (folder === null || folder.mimeType !== FOLDER_MIME_TYPE) return json(route, { error: 'Folder not found' }, 404);
    return json(route, { path: pathOf(folder) });
  },
  download: (route, params) => {
    const file = findFile(params);
    if (file === null) return json(route, { error: 'File not found' }, 404);
    return route.fulfill({ status: 302, headers: { Location: downloadUrl(file.id) } });
  },
  preview: (route, params) => {
    if (findFile(params) === null) return json(route, { error: 'File not found' }, 404);
    return route.fulfill({ contentType: 'text/html', body: PREVIEW_PAGE });
  },
};

export const mockDriveApi = async (page: Page) => {
  await page.route('**/api/*', (route) => {
    const url = new URL(route.request().url());
    const handler = handlers[url.pathname.replace('/api/', '')];
    return handler ? handler(route, url.searchParams) : json(route, { error: 'Not found' }, 404);
  });
  await page.route('https://drive.google.com/**', (route) => route.fulfill({ contentType: 'text/html', body: PREVIEW_PAGE }));
  await page.route('https://img.icons8.com/**', (route) => route.fulfill({ contentType: 'image/x-icon', body: logo }));
  await page.route('**/_vercel/**', (route) => route.fulfill({ status: 404, body: '' }));
};
