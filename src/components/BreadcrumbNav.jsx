import { useRef, useEffect, useState } from 'react';
import { Paper, Breadcrumbs, Anchor, Box, ActionIcon, Group } from '@mantine/core';
import { IconChevronRight, IconChevronLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export function BreadcrumbNav({ pathSegments }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftScroll(scrollLeft > 5);
      setShowRightScroll(Math.abs(scrollWidth - clientWidth - scrollLeft) > 5);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {

        setTimeout(() => {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }, 100);
    }
  }, [pathSegments]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [pathSegments]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const renderBreadcrumbItem = (segment, index, path) => (
    <Anchor
      key={path}
      onClick={(event) => {
        event.preventDefault();
        navigate(path);
      }}
      sx={(theme) => ({
        color: theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6],
        '&:hover': {
          textDecoration: 'underline',
        },
        whiteSpace: 'nowrap',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        cursor: 'pointer',
        display: 'inline-block',
        padding: '2px 4px',
        borderRadius: theme.radius.sm,

        ...(index === pathSegments.length && {
          backgroundColor: theme.colorScheme === 'dark' 
            ? theme.fn.rgba(theme.colors.blue[9], 0.15)
            : theme.fn.rgba(theme.colors.blue[0], 0.5),
        }),
        '@media (max-width: 480px)': {
          maxWidth: segment.length > 30 ? '150px' : 'none',
          overflow: segment.length > 30 ? 'hidden' : 'visible',
          textOverflow: segment.length > 30 ? 'ellipsis' : 'clip',
        }
      })}
      title={decodeURIComponent(segment)}
    >
      {decodeURIComponent(segment)}
    </Anchor>
  );

  const breadcrumbItems = [
    renderBreadcrumbItem('Home', 0, '/'),
    ...pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      return renderBreadcrumbItem(segment, index + 1, path);
    }),
  ];

  return (
    <Paper 
      shadow="xs" 
      p="md" 
      mb="md"
      sx={(theme) => ({
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
      })}
    >
      <Group spacing={0} noWrap>
        {showLeftScroll && (
          <ActionIcon
            variant="subtle"
            onClick={() => handleScroll('left')}
            sx={{ 
              position: 'absolute', 
              left: 0, 
              zIndex: 2,
              height: '100%',
              borderRadius: 0,
              background: theme => theme.colorScheme === 'dark' 
                ? 'linear-gradient(to right, rgba(37, 38, 43, 0.9), transparent)'
                : 'linear-gradient(to right, rgba(255, 255, 255, 0.9), transparent)',
              '&:hover': {
                background: theme => theme.colorScheme === 'dark'
                  ? 'linear-gradient(to right, rgba(37, 38, 43, 1), transparent)'
                  : 'linear-gradient(to right, rgba(255, 255, 255, 1), transparent)',
              }
            }}
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
        )}
        
        <Box
          ref={scrollRef}
          sx={{
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { 
              display: 'none' 
            },
            margin: '0 20px',
            position: 'relative',
            width: '100%',
            scrollBehavior: 'smooth',
          }}
          onScroll={checkScroll}
        >
          <Breadcrumbs 
            separator={
              <IconChevronRight 
                size={16} 
                style={{ 
                  marginTop: 4,
                  color: 'var(--mantine-color-gray-5)',
                  flexShrink: 0,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }} 
              />
            }
            sx={{
              flexWrap: 'nowrap',
              minWidth: 'min-content',
              padding: '2px 0',
            }}
          >
            {breadcrumbItems}
          </Breadcrumbs>
        </Box>

        {showRightScroll && (
          <ActionIcon
            variant="subtle"
            onClick={() => handleScroll('right')}
            sx={{ 
              position: 'absolute', 
              right: 0, 
              zIndex: 2,
              height: '100%',
              borderRadius: 0,
              background: theme => theme.colorScheme === 'dark'
                ? 'linear-gradient(to left, rgba(37, 38, 43, 0.9), transparent)'
                : 'linear-gradient(to left, rgba(255, 255, 255, 0.9), transparent)',
              '&:hover': {
                background: theme => theme.colorScheme === 'dark'
                  ? 'linear-gradient(to left, rgba(37, 38, 43, 1), transparent)'
                  : 'linear-gradient(to left, rgba(255, 255, 255, 1), transparent)',
              }
            }}
          >
            <IconChevronRight size={16} />
          </ActionIcon>
        )}
      </Group>
    </Paper>
  );
} 