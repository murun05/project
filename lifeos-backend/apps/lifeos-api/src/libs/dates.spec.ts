import { addDays, addMonths, diffDays, isIsoDate, todayIn } from './dates';

describe('dates', () => {
  it('validates real calendar dates', () => {
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-1-1')).toBe(false);
  });
  it('adds days across month and year ends', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });
  it('counts days in both directions', () => {
    expect(diffDays('2026-11-03', '2026-11-05')).toBe(2);
    expect(diffDays('2026-11-05', '2026-11-03')).toBe(-2);
  });
  it('clamps month ends instead of overflowing', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
  });
  it('uses the member timezone for today', () => {
    const t = new Date('2026-11-03T16:30:00Z');
    expect(todayIn('Asia/Seoul', t)).toBe('2026-11-04');
    expect(todayIn('UTC', t)).toBe('2026-11-03');
  });
});
