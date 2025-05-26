import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileList } from '../components/FileList';
import driveService from '../services/driveService';

const Folder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState(null);

  const loadFiles = useCallback(async (pageToken = null) => {
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
  }, [location.pathname, navigate]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFolderClick = useCallback((folder) => {
    const newPath = location.pathname === '/' 
      ? `/${encodeURIComponent(folder.name)}`
      : `${location.pathname}/${encodeURIComponent(folder.name)}`;
    navigate(newPath);
  }, [location.pathname, navigate]);

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
};

export default Folder; 