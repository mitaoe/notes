const WORD_START = /(?<![\p{L}\p{N}])[\p{L}\p{N}]/gu;

export const startsNameOrWord = (name: string, term: string) => {
  const lowerName = name.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const starts = [0, ...Array.from(lowerName.matchAll(WORD_START), (match) => match.index)];
  return starts.some((start) => lowerName.startsWith(lowerTerm, start));
};
