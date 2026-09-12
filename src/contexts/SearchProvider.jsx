import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import driveService from '../services/driveService';
import { SearchContext } from './SearchContext';

const SearchProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadedQuery, setLoadedQuery] = useState(null);
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  const trimmedQuery = searchQuery.trim();
  const onSearchRoute = location.pathname === '/search';

  // Adjust state during render rather than in an effect, per the React docs on
  // resetting state when a value changes. Navigating away from the search route
  // drops the query and its results.
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (!location.pathname.startsWith('/search')) {
      setSearchQuery('');
      setFiles([]);
      setNextPageToken(null);
      setError(null);
      setLoadedQuery(null);
    }
  }

  // Derived rather than stored, so no effect has to set it.
  const loading = onSearchRoute && trimmedQuery !== '' && loadedQuery !== trimmedQuery;

  const handleSearch = useCallback(async (pageToken = null) => {
    const query = searchQuery.trim();
    if (!query) {
      setFiles([]);
      setNextPageToken(null);
      setLoadedQuery(null);
      return;
    }

    try {
      const response = await driveService.searchFiles(query, pageToken);

      if (pageToken) {
        setFiles(prev => [...prev, ...response.data.files]);
      } else {
        setFiles(response.data.files);
      }

      setNextPageToken(response.nextPageToken);
      setError(null);
    } catch (error) {
      console.error('Error searching files:', error);
      setError('An error occurred while searching. Please try again.');
      setFiles([]);
    } finally {
      setLoadedQuery(query);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!onSearchRoute || !trimmedQuery) {
      return;
    }
    (async () => {
      await handleSearch();
    })();
  }, [onSearchRoute, trimmedQuery, handleSearch]);

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
};

SearchProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { SearchProvider }; 