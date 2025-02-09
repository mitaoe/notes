import React, { useState } from 'react';
import { TextInput, ActionIcon } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useSearch } from '../contexts/SearchContext';
import { useClickOutside } from '@mantine/hooks';
import { useLocation } from 'react-router-dom';

export function SearchBar({ isMobile = false, onSearchOpen, onSearchClose }) {
  const location = useLocation();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { 
    searchQuery, 
    setSearchQuery, 
    performSearch, 
    clearSearch 
  } = useSearch();

  const handleClickOutside = () => {
    setIsSearchFocused(false);
    if (isMobile && !location.pathname.startsWith('/search') && !searchQuery.trim()) {
      onSearchClose?.();
    }
  };

  const searchRef = useClickOutside(handleClickOutside);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      performSearch();
      setIsSearchFocused(true);
    }
  };

  const handleSearchIconClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (searchQuery.trim()) {
      performSearch();
    }
    const input = e.currentTarget.closest('form').querySelector('input');
    input.focus();
    setIsSearchFocused(true);
  };

  const handleClearSearch = () => {
    clearSearch();
    setIsSearchFocused(true);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const iconTransform = isMobile 
    ? isSearchFocused ? 'translateX(138px)' : 'translateX(0)'
    : isSearchFocused ? 'translateX(236px)' : 'translateX(0)';

  return (
    <form onSubmit={handleSearch} style={{ display: 'flex' }} ref={searchRef}>
      <TextInput
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={handleSearchFocus}
        onBlur={(e) => {
          const isSearchIconClick = e.relatedTarget?.closest('[data-search-icon="true"]');
          if (!isSearchIconClick) {
            setIsSearchFocused(false);
          }
        }}
        autoComplete="off"
        autoFocus={isMobile}
        size={isMobile ? "sm" : "md"}
        icon={
          <ActionIcon
            data-search-icon="true"
            onClick={handleSearchIconClick}
            size="sm"
            variant="transparent"
            tabIndex={-1}
            sx={{
              cursor: 'pointer',
              opacity: isSearchFocused ? 1 : 0.6,
              transition: 'all 0.3s ease-in-out',
              transform: iconTransform,
              pointerEvents: 'auto',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
            <IconSearch size={16} />
          </ActionIcon>
        }
        rightSection={searchQuery && (
          <ActionIcon 
            onClick={handleClearSearch} 
            size="sm" 
            variant="transparent"
            sx={(theme) => ({
              opacity: 1,
              transform: 'translateX(0)',
              transition: 'all 0.3s ease-in-out',
              color: theme.colorScheme === 'dark' 
                ? theme.fn.rgba(theme.colors.red[9], 0.85)
                : theme.fn.rgba(theme.colors.red[7], 0.85),
              '&:hover': {
                backgroundColor: theme.colorScheme === 'dark'
                  ? theme.fn.rgba(theme.colors.red[9], 0.15)
                  : theme.fn.rgba(theme.colors.red[7], 0.15),
              }
            })}
          >
            <IconX size={16} />
          </ActionIcon>
        )}
        styles={(theme) => ({
          root: { 
            position: 'relative',
            width: isMobile ? 200 : 300,
          },
          input: {
            transition: 'all 0.3s ease-in-out',
            paddingLeft: isSearchFocused ? '16px' : '42px',
            '&:focus': {
              borderColor: theme.colors.blue[5],
            },
          },
          rightSection: {
            width: searchQuery ? 76 : 32,
            transition: 'width 0.3s ease-in-out',
            justifyContent: 'flex-end',
            paddingRight: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        })}
      />
    </form>
  );
} 