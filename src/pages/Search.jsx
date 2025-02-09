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
  const [isTyping, setIsTyping] = React.useState(false);

  const handleSearch = async (pageToken = null) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setIsTyping(false);
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

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsTyping(true);
  };

  const handleFolderClick = async (folder) => {
    const path = await driveService.findPathById(folder.id);
    navigate(path);
  };

  const getSearchTitle = () => {
    if (!query) return null;
    if (isTyping) return 'Press Enter to search...';
    if (loading) return 'Searching...';
    if (files.length === 0) return `No results found for "${query}"`;
    return `Search results for "${query}"`;
  };

  return (
    <>
      <Box mb="lg">
        <form onSubmit={handleSubmit}>
          <Group>
            <TextInput
              placeholder="Search files and folders..."
              value={query}
              onChange={handleInputChange}
              style={{ flex: 1 }}
              icon={<IconSearch size={16} />}
            />
            <Button type="submit" loading={loading}>
              Search
            </Button>
          </Group>
        </form>
      </Box>

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
    </>
  );
} 