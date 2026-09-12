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

  const onSearchRoute = location.pathname === '/search';

  const submittedQuery = onSearchRoute
    ? (new URLSearchParams(location.search).get('q') || '').trim()
    : '';
  const [prevSubmitted, setPrevSubmitted] = useState(submittedQuery);

  if (submittedQuery !== prevSubmitted) {
    setPrevSubmitted(submittedQuery);
    if (submittedQuery) {
      setSearchQuery(submittedQuery);
    }
  }

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

  const loading = onSearchRoute && submittedQuery !== '' && loadedQuery !== submittedQuery;

  const runSearch = useCallback(async (query, pageToken = null) => {
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
  }, []);

  useEffect(() => {
    if (!submittedQuery) {
      return;
    }
    (async () => {
      await runSearch(submittedQuery);
    })();
  }, [submittedQuery, runSearch]);

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
    if (!nextPageToken) {
      return Promise.resolve();
    }
    return runSearch(submittedQuery, nextPageToken);
  }, [nextPageToken, runSearch, submittedQuery]);

  const contextValue = {
    searchQuery,
    setSearchQuery,
    submittedQuery,
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