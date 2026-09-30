const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_URL = 'https://www.googleapis.com/drive/v3';
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

type AccessToken = { value: string; expiresAt: number };
type TokenResponse = { access_token: string; expires_in: number };
type QueryParams = Record<string, string | number | boolean>;

export class GoogleApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'GoogleApiError';
    this.status = status;
  }
}

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
  if (!response.ok) throw new GoogleApiError(response.status, `Token refresh failed: ${await response.text()}`);
  const body = (await response.json()) as TokenResponse;
  return { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 - TOKEN_EXPIRY_MARGIN_MS };
};

export const getAccessToken = async () => {
  if (token && token.expiresAt > Date.now()) return token.value;
  pendingToken ??= requestToken().finally(() => {
    pendingToken = null;
  });
  token = await pendingToken;
  return token.value;
};

const driveRequest = async <T>(method: 'GET' | 'POST', path: string, params: QueryParams, body: object | null) => {
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
  if (!response.ok) throw new GoogleApiError(response.status, `Drive ${method} ${path} failed: ${await response.text()}`);
  return (await response.json()) as T;
};

export const driveGet = <T>(path: string, params: QueryParams) => driveRequest<T>('GET', path, params, null);

export const drivePost = <T>(path: string, params: QueryParams, body: object) => driveRequest<T>('POST', path, params, body);
