import { ActionIcon, TextInput } from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { IconSearch, IconX } from '@tabler/icons-react';
import clsx from 'clsx';
import { useRef, useState, type FocusEvent, type FormEvent, type MouseEvent } from 'react';
import classes from './SearchBar.module.css';

type SearchBarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isMobile?: boolean;
  onClickOutside?: () => void;
};

export function SearchBar({ query, onQueryChange, onSearch, onClear, isMobile = false, onClickOutside }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchIconRef = useRef<HTMLButtonElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const formRef = useClickOutside<HTMLFormElement>(() => {
    setIsFocused(false);
    onClickOutside?.();
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    onSearch();
    setIsFocused(true);
  };

  const handleSearchIconClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (query.trim()) onSearch();
    inputRef.current?.focus();
    setIsFocused(true);
  };

  const handleBlur = (event: FocusEvent) => {
    const target = event.relatedTarget;
    if (!(target instanceof Node && searchIconRef.current?.contains(target))) setIsFocused(false);
  };

  const handleClear = () => {
    onClear();
    setIsFocused(true);
  };

  return (
    <form ref={formRef} className={classes.form} onSubmit={handleSubmit}>
      <TextInput
        ref={inputRef}
        placeholder="Search files..."
        aria-label="Search files"
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        autoComplete="off"
        autoFocus={isMobile}
        size={isMobile ? 'sm' : 'md'}
        classNames={{
          root: clsx(classes.root, isMobile && classes.rootMobile),
          input: clsx(classes.input, isFocused && classes.inputFocused),
        }}
        leftSection={
          <ActionIcon
            ref={searchIconRef}
            size="sm"
            variant="transparent"
            tabIndex={-1}
            aria-label="Search"
            className={clsx(
              classes.searchIcon,
              isFocused && classes.searchIconFocused,
              isFocused && isMobile && classes.searchIconFocusedMobile,
            )}
            onClick={handleSearchIconClick}
          >
            <IconSearch size={16} />
          </ActionIcon>
        }
        rightSection={
          query && (
            <ActionIcon size="sm" variant="transparent" aria-label="Clear search" className={classes.clearIcon} onClick={handleClear}>
              <IconX size={16} />
            </ActionIcon>
          )
        }
      />
    </form>
  );
}
