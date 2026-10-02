import { previewUrl } from './_lib/drive.ts';
import { handleFileLink } from './_lib/file-link.ts';

export const GET = handleFileLink(previewUrl);
