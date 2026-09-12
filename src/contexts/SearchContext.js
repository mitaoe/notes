import { createContext, useContext } from 'react';

const SearchContext = createContext(null);

const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export { SearchContext, useSearch };
