import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDebouncedValue } from '@mantine/hooks';
import driveService from '../services/driveService';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);

  const handleSearch = useCallback(async (pageToken = null) => {
    if (!searchQuery.trim()) {
      setFiles([]);
      setNextPageToken(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await driveService.searchFiles(searchQuery, pageToken);
      
      if (pageToken) {
        setFiles(prev => [...prev, ...response.data.files]);
      } else {
        setFiles(response.data.files);
      }
      
      setNextPageToken(response.nextPageToken);
    } catch (error) {
      console.error('Error searching files:', error);
      setError('An error occurred while searching. Please try again.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (location.pathname === '/search' && searchQuery.trim()) {
      handleSearch();
    }
  }, [location.pathname, searchQuery, handleSearch]);

  const performSearch = useCallback(() => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, navigate]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFiles([]);
    setNextPageToken(null);
    setError(null);
    if (location.pathname === '/search') {
      navigate('/');
    }
  }, [navigate, location.pathname]);

  const loadMore = useCallback(() => {
    if (nextPageToken) {
      handleSearch(nextPageToken);
    }
  }, [nextPageToken, handleSearch]);

  const contextValue = {
    searchQuery,
    setSearchQuery,
    files,
    loading,
    error,
    hasMore: !!nextPageToken,
    performSearch,
    clearSearch,
    loadMore,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
} 