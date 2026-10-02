import { useTimeout } from '@mantine/hooks';
import { useState } from 'react';

import { downloadHref } from '../api/drive.ts';

const DOWNLOAD_FEEDBACK_MS = 500;

export const useDownload = (fileId: string) => {
  const [downloading, setDownloading] = useState(false);
  const feedback = useTimeout(() => setDownloading(false), DOWNLOAD_FEEDBACK_MS);

  const download = () => {
    setDownloading(true);
    window.open(downloadHref(fileId), '_blank', 'noopener');
    feedback.start();
  };

  return { downloading, download };
};
