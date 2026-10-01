import { shareFile } from './drive.ts';
import {
  CACHE_CONTROL,
  HttpError,
  driveIdParam,
  handleGet,
  redirect,
  type ErrorResponder,
} from './http.ts';

const ERROR_PAGE_POLICY = "default-src 'none'; style-src 'unsafe-inline'";
const ERROR_PAGE_STYLE =
  'body{min-height:90vh;display:grid;place-content:center;gap:1rem;text-align:center;font-family:system-ui,sans-serif}h1,p{margin:0}';
const ERROR_MESSAGES = new Map([
  [400, 'This link is not valid.'],
  [404, 'This file is no longer available. It may have been moved or deleted.'],
]);
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

const errorPage: ErrorResponder = (error) =>
  new Response(
    [
      '<!doctype html>',
      '<html lang="en">',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="color-scheme" content="dark">',
      '<title>File unavailable</title>',
      `<style>${ERROR_PAGE_STYLE}</style>`,
      '<h1>File unavailable</h1>',
      `<p>${ERROR_MESSAGES.get(error.status) ?? FALLBACK_MESSAGE}</p>`,
      '<p><a href="/">Back to the notes</a></p>',
    ].join(''),
    {
      status: error.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': ERROR_PAGE_POLICY,
        'Cache-Control': error.cacheControl,
      },
    },
  );

export const handleFileLink = (toUrl: (fileId: string) => string) =>
  handleGet(async (params) => {
    const fileId = driveIdParam(params);
    if (!(await shareFile(fileId)))
      throw new HttpError(404, 'File not found', CACHE_CONTROL.listing);
    return redirect(toUrl(fileId), CACHE_CONTROL.fileLink);
  }, errorPage);
