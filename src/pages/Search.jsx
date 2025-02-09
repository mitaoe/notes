import React, { useEffect } from 'react';
import { Title, Box, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { FileList } from '../components/FileList';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import driveService from '../services/driveService';

export function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    searchQuery, 
    setSearchQuery, 
    files, 
    loading, 
    error, 
    hasMore, 
    loadMore 
  } = useSearch();

  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam && queryParam !== searchQuery) {
      setSearchQuery(queryParam);
    }
  }, [searchParams]);

  const handleFolderClick = async (folder) => {
    const path = await driveService.findPathById(folder.id);
    navigate(path);
  };

  const getSearchTitle = () => {
    if (!searchQuery) return null;
    if (loading) return (
      <Text span weight={400} color="dimmed">Searching...</Text>
    );
    if (error) return (
      <Text span weight={400} color="red">Search failed</Text>
    );
    if (files.length === 0) return (
      <>
        <Text span color="dimmed">No items found matching </Text>
        <Text span weight={500}>"{searchQuery}"</Text>
      </>
    );
    return (
      <>
        <Text span color="dimmed">Results for </Text>
        <Text span weight={500}>"{searchQuery}"</Text>
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
            color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[9],
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
} 