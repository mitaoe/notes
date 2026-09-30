import { createTheme, type MantineColorsTuple } from '@mantine/core';

const FONT_FAMILY = 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';

const dark: MantineColorsTuple = [
  '#C1C2C5',
  '#A6A7AB',
  '#909296',
  '#5C5F66',
  '#373A40',
  '#2C2E33',
  '#25262B',
  '#1A1B1E',
  '#141517',
  '#101113',
];

const blue: MantineColorsTuple = [
  '#DBE5F8',
  '#B7CCF1',
  '#93B3EA',
  '#6F9AE3',
  '#4B81DC',
  '#2768D5',
  '#1A73E8',
  '#1557B0',
  '#104489',
  '#0B3162',
];

export const theme = createTheme({
  primaryColor: 'blue',
  colors: { dark, blue },
  fontFamily: FONT_FAMILY,
  headings: { fontFamily: FONT_FAMILY },
});
