import { Text } from '@mantine/core';

type SearchTitleProps = { query: string; loading: boolean; failed: boolean; empty: boolean };

export function SearchTitle({ query, loading, failed, empty }: SearchTitleProps) {
  if (loading) {
    return (
      <Text span fw={400} c="dimmed">
        Searching...
      </Text>
    );
  }
  if (failed) {
    return (
      <Text span fw={400} c="red">
        Search failed
      </Text>
    );
  }
  return (
    <>
      <Text span c="dimmed">
        {empty ? 'No items found matching ' : 'Results for '}
      </Text>
      <Text span fw={500}>
        &quot;{query}&quot;
      </Text>
    </>
  );
}
