import { Text, Title } from '@mantine/core';

import classes from './SearchTitle.module.css';

type SearchTitleProps = { query: string; loading: boolean; failed: boolean; empty: boolean };

export function SearchTitle({ query, loading, failed, empty }: SearchTitleProps) {
  const status = loading ? 'Searching...' : failed && empty ? 'Search failed' : null;
  return (
    <Title order={2} mb="xl" className={classes.title}>
      {status !== null ? (
        <Text span fw={400} c={loading ? 'dimmed' : 'red'}>
          {status}
        </Text>
      ) : (
        <>
          <Text span c="dimmed">
            {empty ? 'No items found matching ' : 'Results for '}
          </Text>
          <Text span fw={500}>
            &quot;{query}&quot;
          </Text>
        </>
      )}
    </Title>
  );
}
