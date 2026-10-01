import { useEffect } from 'react';

import { site } from '../config.ts';

const SITE_TITLE = document.title;

export const usePageTitle = (name: string | null, active: boolean) => {
  useEffect(() => {
    if (active) document.title = name === null ? SITE_TITLE : `${name} | ${site.title}`;
  }, [name, active]);
};
