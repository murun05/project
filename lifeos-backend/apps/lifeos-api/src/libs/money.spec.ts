import { fromMinor, monthlyMinor, toMinor, yearlyMinor } from './money';

describe('money', () => {
  it('parses decimals without floating point', () => {
    expect(toMinor('129000', 'KRW')).toBe(129000);
    expect(toMinor('129000.00', 'KRW')).toBe(129000);
    expect(toMinor('2.99', 'USD')).toBe(299);
    expect(toMinor('2.9', 'USD')).toBe(290);
    expect(toMinor('5', 'USD')).toBe(500);
  });
  it('rejects bad amounts', () => {
    expect(() => toMinor('2.999', 'USD')).toThrow();
    expect(() => toMinor('abc', 'USD')).toThrow();
    expect(() => toMinor('-3', 'USD')).toThrow();
  });
  it('formats minor units', () => {
    expect(fromMinor(299, 'USD')).toBe('2.99');
    expect(fromMinor(5, 'USD')).toBe('0.05');
    expect(fromMinor(129000, 'KRW')).toBe('129000');
  });
  it('computes yearly and monthly totals', () => {
    expect(yearlyMinor(10900, 'MONTHLY')).toBe(130800);
    expect(yearlyMinor(120000, 'YEARLY')).toBe(120000);
    expect(monthlyMinor(586800)).toBe(48900);
  });
});
