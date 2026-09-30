import { useLocation } from 'react-router';

export const LOCATION_TEST_ID = 'location';

export function CurrentLocation() {
  const { pathname, search } = useLocation();
  return <output data-testid={LOCATION_TEST_ID}>{`${pathname}${search}`}</output>;
}
