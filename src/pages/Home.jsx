import React from 'react';
import { Title, Breadcrumbs, Anchor } from '@mantine/core';
import { FileList } from '../components/FileList';
import { listFiles } from '../services/driveService';
import { Link } from 'react-router-dom';

export function Home() {
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [nextPageToken, setNextPageToken] = React.useState(null);

  const loadFiles = async (pageToken = null) => {
    try {
      const response = await listFiles('root', pageToken);
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

  React.useEffect(() => {
    loadFiles();
  }, []);

  const items = [
    { title: 'Home', href: '/' },
  ].map((item, index) => (
    <Anchor component={Link} to={item.href} key={index}>
      {item.title}
    </Anchor>
  ));

  return (
    <>
      <Breadcrumbs mb="md">{items}</Breadcrumbs>
      <Title order={2} mb="md">Files and Folders</Title>
      <FileList 
        files={files} 
        loading={loading} 
        hasMore={!!nextPageToken}
        onLoadMore={() => loadFiles(nextPageToken)}
      />
    </>
  );
} 