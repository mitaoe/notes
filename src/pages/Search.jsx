import React from 'react';
import { Title, Breadcrumbs, Anchor } from '@mantine/core';
import { FileList } from '../components/FileList';
import { searchFiles } from '../services/driveService';
import { Link, useSearchParams } from 'react-router-dom';

export function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [nextPageToken, setNextPageToken] = React.useState(null);

  const performSearch = async (pageToken = null) => {
    if (!query) return;
    
    try {
      const response = await searchFiles(query, pageToken);
      if (pageToken) {
        setFiles(prev => [...prev, ...response.files]);
      } else {
        setFiles(response.files);
      }
      setNextPageToken(response.nextPageToken);
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setLoading(true);
    setFiles([]);
    performSearch();
  }, [query]);

  const items = [
    { title: 'Home', href: '/' },
    { title: `Search: ${query}`, href: `/search?q=${encodeURIComponent(query)}` },
  ].map((item, index) => (
    <Anchor component={Link} to={item.href} key={index}>
      {item.title}
    </Anchor>
  ));

  return (
    <>
      <Breadcrumbs mb="md">{items}</Breadcrumbs>
      <Title order={2} mb="md">Search Results for "{query}"</Title>
      <FileList 
        files={files} 
        loading={loading} 
        hasMore={!!nextPageToken}
        onLoadMore={() => performSearch(nextPageToken)}
      />
    </>
  );
} 