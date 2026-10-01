import type { ApiBody } from '../../shared/drive.ts';
import { StatusError } from '../../shared/status-error.ts';

export const CACHE_CONTROL = {
  listing: 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
  folderPath: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
  fileLink: 'public, max-age=0, s-maxage=86400',
  none: 'no-store',
} as const;

const DRIVE_ID_PATTERN = /^[\w-]+$/;

export class HttpError extends StatusError {
  readonly cacheControl: string;

  constructor(status: number, message: string, cacheControl: string = CACHE_CONTROL.none) {
    super(status, message);
    this.cacheControl = cacheControl;
  }
}

export const json = (body: ApiBody, status: number, cacheControl: string) =>
  Response.json(body, { status, headers: { 'Cache-Control': cacheControl } });

export const redirect = (location: string, cacheControl: string) =>
  new Response(null, {
    status: 302,
    headers: { Location: location, 'Cache-Control': cacheControl },
  });

export const optionalParam = (params: URLSearchParams, name: string) => params.get(name) || null;

export const requiredParam = (params: URLSearchParams, name: string) => {
  const value = optionalParam(params, name);
  if (value === null) throw new HttpError(400, `${name} is required`);
  return value;
};

export const driveIdParam = (params: URLSearchParams) => {
  const id = requiredParam(params, 'id');
  if (!DRIVE_ID_PATTERN.test(id)) throw new HttpError(400, 'id is invalid');
  return id;
};

export type ErrorResponder = (error: HttpError) => Response;

const jsonError: ErrorResponder = (error) =>
  json({ error: error.message }, error.status, error.cacheControl);

export const handleGet =
  (handler: (params: URLSearchParams) => Promise<Response>, respondWithError = jsonError) =>
  async (request: Request) => {
    try {
      return await handler(new URL(request.url).searchParams);
    } catch (error) {
      if (error instanceof HttpError) return respondWithError(error);
      console.error(error);
      return respondWithError(new HttpError(500, 'Something went wrong'));
    }
  };
