import { searchFiles } from './_lib/drive.ts';
import {
  CACHE_CONTROL,
  HttpError,
  handleGet,
  json,
  optionalParam,
  requiredParam,
} from './_lib/http.ts';

const MAX_QUERY_LENGTH = 200;

export const GET = handleGet(async (params) => {
  const query = requiredParam(params, 'q').trim();
  if (query.length > MAX_QUERY_LENGTH)
    throw new HttpError(400, `q must be at most ${MAX_QUERY_LENGTH} characters`);
  return json(
    await searchFiles(query, optionalParam(params, 'pageToken')),
    200,
    CACHE_CONTROL.listing,
  );
});
