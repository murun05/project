import { RecordType, ReminderKind, BillingCycle } from './enums';
import { desiredReminders, isSurfaced, leadDays, nextRenewal } from './reminder-rules';

describe('reminder rules', () => {
  it('derives purchase reminders from its dates', () => {
    const r = desiredReminders({ type: RecordType.PURCHASE, returnBy: '2026-11-10', warrantyEnd: '2027-10-01' });
    expect(r.map((x) => x.kind)).toEqual([ReminderKind.RETURN, ReminderKind.WARRANTY]);
  });
  it('uses a trial reminder instead of a renewal while on a trial', () => {
    const base = { type: RecordType.SUBSCRIPTION, renewal: '2026-12-01', trialEnd: '2026-11-08' };
    expect(desiredReminders({ ...base, trial: true }).map((x) => x.kind)).toEqual([ReminderKind.TRIAL]);
    expect(desiredReminders({ ...base, trial: false }).map((x) => x.kind)).toEqual([ReminderKind.RENEWAL]);
  });
  it('uses the subscription remind-days for renewals only', () => {
    expect(leadDays(ReminderKind.RENEWAL, 5)).toBe(5);
    expect(leadDays(ReminderKind.RENEWAL)).toBe(3);
    expect(leadDays(ReminderKind.WARRANTY, 5)).toBe(30);
  });
  it('surfaces within the lead window and respects done and snooze', () => {
    const a = { date: '2026-11-10', done: false };
    expect(isSurfaced(a, '2026-11-03', 7)).toBe(true);
    expect(isSurfaced(a, '2026-11-02', 7)).toBe(false);
    expect(isSurfaced({ ...a, done: true }, '2026-11-09', 7)).toBe(false);
    expect(isSurfaced({ ...a, snoozeUntil: '2026-11-05' }, '2026-11-04', 7)).toBe(false);
    expect(isSurfaced({ ...a, snoozeUntil: '2026-11-05' }, '2026-11-05', 7)).toBe(true);
    expect(isSurfaced({ date: '2026-11-01', done: false }, '2026-11-03', 7)).toBe(true);
  });
  it('advances renewals by the billing cycle', () => {
    expect(nextRenewal('2026-01-31', BillingCycle.MONTHLY)).toBe('2026-02-28');
    expect(nextRenewal('2026-11-03', BillingCycle.YEARLY)).toBe('2027-11-03');
  });
});
