import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileList } from '../components/FileList';
import driveService from '../services/driveService';
import { Box } from '@mantine/core';

export function Home() {
  const navigate = useNavigate();
  const [files, setFiles] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const [nextPageToken, setNextPageToken] = React.useState(null);
  const loading = !loaded;

  const loadFiles = async (pageToken = null) => {
    try {
      const response = await driveService.listFiles('/', pageToken);
      if (pageToken) {
        setFiles(prev => [...prev, ...response.files]);
      } else {
        setFiles(response.files);
      }
      setNextPageToken(response.nextPageToken);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoaded(true);
    }
  };

  React.useEffect(() => {
    (async () => {
      await loadFiles();
    })();
  }, []);

  const handleFolderClick = (folder) => {
    navigate(`/${folder.name}`);
  };

  return (
    <Box sx={{ paddingTop: '2rem', '& .mantine-Paper-root': { padding: '1rem 1.5rem' } }}>
      <FileList 
        files={files}
        loading={loading}
        hasMore={!!nextPageToken}
        onLoadMore={() => loadFiles(nextPageToken)}
        onFolderClick={handleFolderClick}
      />
    </Box>
  );
} 