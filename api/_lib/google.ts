import * as v from 'valibot';

import { StatusError } from '../../shared/status-error.ts';

export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const DRIVE_URL = 'https://www.googleapis.com/drive/v3';
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

const TokenResponseSchema = v.object({
  access_token: v.string(),
  expires_in: v.number(),
});

type AccessToken = { value: string; expiresAt: number };
type QueryParams = Record<string, string | number | boolean>;

export class GoogleApiError extends StatusError {}

let token: AccessToken | null = null;
let pendingToken: Promise<AccessToken> | null = null;

const readCredential = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

const requestToken = async (): Promise<AccessToken> => {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: readCredential('VITE_GOOGLE_CLIENT_ID'),
      client_secret: readCredential('VITE_GOOGLE_CLIENT_SECRET'),
      refresh_token: readCredential('VITE_GOOGLE_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  });
  if (!response.ok)
    throw new GoogleApiError(response.status, `Token refresh failed: ${await response.text()}`);
  const body = v.parse(TokenResponseSchema, await response.json());
  return {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000 - TOKEN_EXPIRY_MARGIN_MS,
  };
};

const getAccessToken = async () => {
  if (token && token.expiresAt > Date.now()) return token.value;
  pendingToken ??= requestToken().finally(() => {
    pendingToken = null;
  });
  token = await pendingToken;
  return token.value;
};

type DriveRequest<TSchema extends v.GenericSchema> = {
  method: 'GET' | 'POST';
  path: string;
  params: QueryParams;
  body: object | null;
  schema: TSchema;
};

const driveRequest = async <TSchema extends v.GenericSchema>({
  method,
  path,
  params,
  body,
  schema,
}: DriveRequest<TSchema>) => {
  const url = new URL(`${DRIVE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      ...(body === null ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === null ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok)
    throw new GoogleApiError(
      response.status,
      `Drive ${method} ${path} failed: ${await response.text()}`,
    );
  return v.parse(schema, await response.json());
};

export const driveGet = <TSchema extends v.GenericSchema>(
  path: string,
  params: QueryParams,
  schema: TSchema,
) => driveRequest({ method: 'GET', path, params, body: null, schema });

export const drivePost = <TSchema extends v.GenericSchema>(
  path: string,
  params: QueryParams,
  body: object,
  schema: TSchema,
) => driveRequest({ method: 'POST', path, params, body, schema });
