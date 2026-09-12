import { Title, Box, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { FileList } from '../components/FileList';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import driveService from '../services/driveService';

const Search = () => {
  const navigate = useNavigate();
  const {
    submittedQuery,
    files,
    loading,
    error,
    hasMore,
    loadMore
  } = useSearch();

  const handleFolderClick = async (folder) => {
    const path = await driveService.findPathById(folder.id);
    navigate(path);
  };

  const getSearchTitle = () => {
    if (!submittedQuery) return null;
    if (loading) return (
      <Text span fw={400} c="dimmed">Searching...</Text>
    );
    if (error) return (
      <Text span fw={400} c="red">Search failed</Text>
    );
    if (files.length === 0) return (
      <>
        <Text span c="dimmed">No items found matching </Text>
        <Text span fw={500}>&quot;{submittedQuery}&quot;</Text>
      </>
    );
    return (
      <>
        <Text span c="dimmed">Results for </Text>
        <Text span fw={500}>&quot;{submittedQuery}&quot;</Text>
      </>
    );
  };

  return (
    <Box sx={{ paddingTop: '2rem' }}>
      {getSearchTitle() && (
        <Title 
          order={2} 
          mb="xl"
          sx={(theme) => ({
            fontSize: '1.5rem',
            fontWeight: 500,
            color: theme.colors.dark[0],
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          })}
        >
          {getSearchTitle()}
        </Title>
      )}

      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Error" 
          color="red" 
          mb="xl"
          variant="filled"
        >
          {error}
        </Alert>
      )}

      <FileList 
        files={files}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onFolderClick={handleFolderClick}
      />
    </Box>
  );
};

export default Search; 