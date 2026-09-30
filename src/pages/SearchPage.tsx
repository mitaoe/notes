import { Alert, Box, Text, Title } from '@mantine/core';
import { IconAlertCircle } from '../icons.ts';
import { useNavigate, useSearchParams } from 'react-router';
import type { DriveItem } from '../../shared/drive.ts';
import { fetchFolderPath, fetchSearch } from '../api/drive.ts';
import { FileList } from '../components/FileList.tsx';
import { usePagedFiles } from '../hooks/usePagedFiles.ts';
import classes from './Page.module.css';

const SEARCH_ERROR = 'An error occurred while searching. Please try again.';

type SearchTitleProps = { query: string; loading: boolean; failed: boolean; empty: boolean };

function SearchTitle({ query, loading, failed, empty }: SearchTitleProps) {
  if (loading) return <Text span fw={400} c="dimmed">Searching...</Text>;
  if (failed) return <Text span fw={400} c="red">Search failed</Text>;
  return (
    <>
      <Text span c="dimmed">{empty ? 'No items found matching ' : 'Results for '}</Text>
      <Text span fw={500}>&quot;{query}&quot;</Text>
    </>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const { files, loading, failed, hasMore, loadMore } = usePagedFiles(query || null, fetchSearch);

  const openFolder = async (folder: DriveItem) => {
    try {
      await navigate(await fetchFolderPath(folder.id));
    } catch (error) {
      console.error(error);
      await navigate('/404');
    }
  };

  return (
    <Box className={classes.page}>
      {query && (
        <Title order={2} mb="xl" className={classes.searchTitle}>
          <SearchTitle query={query} loading={loading} failed={failed} empty={files.length === 0} />
        </Title>
      )}

      {failed && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="xl" variant="filled">
          {SEARCH_ERROR}
        </Alert>
      )}

      <FileList files={files} loading={loading} hasMore={hasMore} onLoadMore={loadMore} onFolderClick={(folder) => void openFolder(folder)} />
    </Box>
  );
}
