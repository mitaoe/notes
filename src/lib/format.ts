const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export const formatFileSize = (bytes: number) => {
  if (bytes <= 0) return '0 B';
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  return `${parseFloat((bytes / 1024 ** exponent).toFixed(2))} ${UNITS[exponent]}`;
};
