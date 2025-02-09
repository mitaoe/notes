import React from 'react';
import { Title, Box } from '@mantine/core';
import { FileList } from '../components/FileList';
import driveService from '../services/driveService';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get('q') || '');
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [nextPageToken, setNextPageToken] = React.useState(null);

  const handleSearch = async (pageToken = null) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      const response = await driveService.searchFiles(query, pageToken);
      
      if (pageToken) {
        setFiles(prev => [...prev, ...response.data.files]);
      } else {
        setFiles(response.data.files);
      }
      
      setNextPageToken(response.nextPageToken);
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      handleSearch();
    }
  }, [searchParams]);

  const handleFolderClick = async (folder) => {
    const path = await driveService.findPathById(folder.id);
    navigate(path);
  };

  const getSearchTitle = () => {
    if (!query) return null;
    if (loading) return 'Searching...';
    if (files.length === 0) return `No results found for "${query}"`;
    return `Search results for "${query}"`;
  };

  return (
    <Box>
      {getSearchTitle() && (
        <Title order={2} mb="md">
          {getSearchTitle()}
        </Title>
      )}

      <FileList 
        files={files}
        loading={loading}
        hasMore={!!nextPageToken}
        onLoadMore={() => handleSearch(nextPageToken)}
        onFolderClick={handleFolderClick}
      />
    </Box>
  );
} 