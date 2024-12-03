import { createStyles } from '@mantine/core';

export const useStyles = createStyles((theme) => ({
  wrapper: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
    minWidth: '100%',
    '& th, & td': {
      '@media (max-width: 768px)': {
        padding: '8px',
      },
    },
  },
  icon: {
    color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6],
  },
  link: {
    color: theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6],
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
})); 