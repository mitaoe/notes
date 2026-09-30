import { ActionIcon, Anchor, Box, Breadcrumbs, Group, Paper } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '../icons.ts';
import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import classes from './BreadcrumbNav.module.css';

const LONG_LABEL_LENGTH = 30;
const SCROLL_STEP_PX = 150;
const SCROLL_EDGE_PX = 5;
const SCROLL_TO_END_DELAY_MS = 100;

type Crumb = { label: string; path: string };

const decodeSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const toCrumbs = (pathname: string): Crumb[] => {
  const segments = pathname.split('/').filter(Boolean);
  return [
    { label: 'Home', path: '/' },
    ...segments.map((segment, index) => ({
      label: decodeSegment(segment),
      path: `/${segments.slice(0, index + 1).join('/')}`,
    })),
  ];
};

type BreadcrumbNavProps = { pathname: string };

export function BreadcrumbNav({ pathname }: BreadcrumbNavProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const crumbs = toCrumbs(pathname);

  const updateScrollButtons = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const { scrollLeft, scrollWidth, clientWidth } = viewport;
    setCanScrollLeft(scrollLeft > SCROLL_EDGE_PX);
    setCanScrollRight(Math.abs(scrollWidth - clientWidth - scrollLeft) > SCROLL_EDGE_PX);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const viewport = viewportRef.current;
      if (viewport) viewport.scrollLeft = viewport.scrollWidth;
    }, SCROLL_TO_END_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [updateScrollButtons]);

  const scrollBy = (left: number) => viewportRef.current?.scrollBy({ left, behavior: 'smooth' });

  return (
    <Paper shadow="xs" p="md" mb="md" className={classes.paper}>
      <Group gap={0} wrap="nowrap">
        {canScrollLeft && (
          <ActionIcon
            variant="subtle"
            aria-label="Scroll breadcrumbs left"
            className={clsx(classes.scrollButton, classes.scrollLeft)}
            onClick={() => scrollBy(-SCROLL_STEP_PX)}
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
        )}

        <Box ref={viewportRef} className={classes.viewport} onScroll={updateScrollButtons}>
          <Breadcrumbs className={classes.breadcrumbs} separator={<IconChevronRight size={16} className={classes.separator} />}>
            {crumbs.map((crumb, index) => (
              <Anchor
                key={crumb.path}
                component={Link}
                to={crumb.path}
                title={crumb.label}
                className={clsx(
                  classes.crumb,
                  index === crumbs.length - 1 && classes.current,
                  crumb.label.length > LONG_LABEL_LENGTH && classes.long,
                )}
              >
                {crumb.label}
              </Anchor>
            ))}
          </Breadcrumbs>
        </Box>

        {canScrollRight && (
          <ActionIcon
            variant="subtle"
            aria-label="Scroll breadcrumbs right"
            className={clsx(classes.scrollButton, classes.scrollRight)}
            onClick={() => scrollBy(SCROLL_STEP_PX)}
          >
            <IconChevronRight size={16} />
          </ActionIcon>
        )}
      </Group>
    </Paper>
  );
}
