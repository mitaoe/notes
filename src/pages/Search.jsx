import React from 'react';
import { Title, TextInput, Group, Button, Box } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      handleSearch();
    }
  };

  const handleFolderClick = async (folder) => {
    const path = await driveService.findPathById(folder.id);
    navigate(path);
  };

  return (
    <>
      <Box mb="lg">
        <form onSubmit={handleSubmit}>
          <Group>
            <TextInput
              placeholder="Search files and folders..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1 }}
              icon={<IconSearch size={16} />}
            />
            <Button type="submit" loading={loading}>
              Search
            </Button>
          </Group>
        </form>
      </Box>

      {query && (
        <Title order={2} mb="md">
          Search results for "{query}"
        </Title>
      )}

      <FileList 
        files={files}
        loading={loading}
        hasMore={!!nextPageToken}
        onLoadMore={() => handleSearch(nextPageToken)}
        onFolderClick={handleFolderClick}
      />
    </>
  );
} 