import type { ApiError } from '../../shared/drive.ts';

export const CACHE_CONTROL = {
  listing: 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
  folderPath: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
  fileLink: 'public, max-age=0, s-maxage=86400',
  none: 'no-store',
} as const;

const DRIVE_ID_PATTERN = /^[\w-]+$/;

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export const json = <T>(body: T, status: number, cacheControl: string) =>
  Response.json(body, { status, headers: { 'Cache-Control': cacheControl } });

export const redirect = (location: string, cacheControl: string) =>
  new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': cacheControl } });

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

export const handleGet = (handler: (params: URLSearchParams) => Promise<Response>) => async (request: Request) => {
  try {
    return await handler(new URL(request.url).searchParams);
  } catch (error) {
    if (error instanceof HttpError) return json<ApiError>({ error: error.message }, error.status, CACHE_CONTROL.none);
    console.error(error);
    return json<ApiError>({ error: 'Something went wrong' }, 500, CACHE_CONTROL.none);
  }
};
