import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileList } from '../components/FileList';
import driveService from '../services/driveService';

export function Folder() {
  const location = useLocation();
  const navigate = useNavigate();
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [nextPageToken, setNextPageToken] = React.useState(null);

  const loadFiles = async (pageToken = null) => {
    try {
      setLoading(true);
      const response = await driveService.listFiles(location.pathname, pageToken);
      if (pageToken) {
        setFiles(prev => [...prev, ...response.files]);
      } else {
        setFiles(response.files);
      }
      setNextPageToken(response.nextPageToken);
    } catch (error) {
      console.error('Error loading folder:', error);
      if (error.message === 'Folder not found') {
        navigate('/404');
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadFiles();
  }, [location.pathname]);

  const handleFolderClick = (folder) => {
    const newPath = location.pathname === '/' 
      ? `/${encodeURIComponent(folder.name)}`
      : `${location.pathname}/${encodeURIComponent(folder.name)}`;
    navigate(newPath);
  };

  return (
    <div style={{ paddingTop: '2rem' }}>
      <FileList 
        files={files}
        loading={loading}
        hasMore={!!nextPageToken}
        onLoadMore={() => loadFiles(nextPageToken)}
        onFolderClick={handleFolderClick}
      />
    </div>
  );
} 