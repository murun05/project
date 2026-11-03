import { matchesOwned } from './match';

describe('matchesOwned', () => {
  it('matches names in either direction, ignoring plurals', () => {
    expect(matchesOwned('milk', 'Milk (opened)')).toBe(true);
    expect(matchesOwned('eggs', 'Eggs')).toBe(true);
    expect(matchesOwned('wireless headphones', 'headphones')).toBe(true);
  });
  it('ignores very short or unrelated names', () => {
    expect(matchesOwned('a', 'Apple')).toBe(false);
    expect(matchesOwned('milk', 'A')).toBe(false);
    expect(matchesOwned('bread', 'Milk')).toBe(false);
  });
});
