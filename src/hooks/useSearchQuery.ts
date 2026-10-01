import { useMatch, useSearchParams } from 'react-router';

import { routes } from '../config.ts';

export const useSearchQuery = () => {
  const onSearchRoute = useMatch(routes.search) !== null;
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  return onSearchRoute && query ? query : null;
};
