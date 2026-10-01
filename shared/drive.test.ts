import { describe, expect, it } from 'vitest';

import { MAX_SEARCH_LENGTH, limitSearch } from './drive.ts';

describe('limitSearch', () => {
  it('keeps searches within the limit as they are', () => {
    expect(limitSearch('unit 1')).toBe('unit 1');
  });

  it('cuts longer searches to the limit', () => {
    expect(limitSearch('a'.repeat(MAX_SEARCH_LENGTH + 5))).toBe('a'.repeat(MAX_SEARCH_LENGTH));
  });

  it('never cuts a character in half', () => {
    const limited = limitSearch(`${'a'.repeat(MAX_SEARCH_LENGTH - 1)}\u{1F600}b`);
    expect(limited).toBe('a'.repeat(MAX_SEARCH_LENGTH - 1));
    expect(() => encodeURIComponent(limited)).not.toThrow();
  });
});
