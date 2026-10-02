import { MAX_SEARCH_LENGTH } from '../shared/drive.ts';
import { searchFiles } from './_lib/drive.ts';
import {
  CACHE_CONTROL,
  HttpError,
  handleGet,
  json,
  optionalParam,
  requiredParam,
} from './_lib/http.ts';

export const GET = handleGet(async (params) => {
  const query = requiredParam(params, 'q').trim();
  if (query.length > MAX_SEARCH_LENGTH) {
    throw new HttpError(400, `q must be at most ${MAX_SEARCH_LENGTH} characters`);
  }
  return json(
    await searchFiles(query, optionalParam(params, 'pageToken')),
    200,
    CACHE_CONTROL.listing,
  );
});
