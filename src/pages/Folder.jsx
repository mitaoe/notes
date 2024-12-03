import React from 'react';
import { Title, Breadcrumbs, Anchor } from '@mantine/core';
import { FileList } from '../components/FileList';
import { listFiles, getFileMetadata } from '../services/driveService';
import { Link, useParams } from 'react-router-dom';

export function Folder() {
  const { folderId } = useParams();
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [nextPageToken, setNextPageToken] = React.useState(null);
  const [folderPath, setFolderPath] = React.useState([]);

  const loadFiles = async (pageToken = null) => {
    try {
      const response = await listFiles(folderId, pageToken);
      if (pageToken) {
        setFiles(prev => [...prev, ...response.files]);
      } else {
        setFiles(response.files);
      }
      setNextPageToken(response.nextPageToken);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolderPath = async () => {
    try {
      const folderInfo = await getFileMetadata(folderId);
      setFolderPath([
        { title: 'Home', href: '/' },
        { title: folderInfo.name, href: `/folder/${folderId}` },
      ]);
    } catch (error) {
      console.error('Error loading folder path:', error);
    }
  };

  React.useEffect(() => {
    loadFiles();
    loadFolderPath();
  }, [folderId]);

  const breadcrumbs = folderPath.map((item, index) => (
    <Anchor component={Link} to={item.href} key={index}>
      {item.title}
    </Anchor>
  ));

  return (
    <>
      <Breadcrumbs mb="md">{breadcrumbs}</Breadcrumbs>
      <Title order={2} mb="md">{folderPath[folderPath.length - 1]?.title || 'Loading...'}</Title>
      <FileList 
        files={files} 
        loading={loading} 
        hasMore={!!nextPageToken}
        onLoadMore={() => loadFiles(nextPageToken)}
      />
    </>
  );
} 