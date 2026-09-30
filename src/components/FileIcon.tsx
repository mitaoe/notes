import { isFolder, type DriveItem } from '../../shared/drive.ts';
import { IconFile, IconFolder, IconMusic, IconPhoto, IconPlayerPlay } from '../icons.ts';

const ICON_SIZE = 20;

type FileIconProps = { file: DriveItem };

export function FileIcon({ file }: FileIconProps) {
  if (isFolder(file)) return <IconFolder size={ICON_SIZE} />;
  const mimeType = file.mimeType.toLowerCase();
  if (mimeType.includes('video')) return <IconPlayerPlay size={ICON_SIZE} />;
  if (mimeType.includes('image')) return <IconPhoto size={ICON_SIZE} />;
  if (mimeType.includes('audio')) return <IconMusic size={ICON_SIZE} />;
  return <IconFile size={ICON_SIZE} />;
}
