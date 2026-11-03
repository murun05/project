import { BillingCycle, RecordType } from './enums';
import { validateRecord } from './record-rules';

describe('record rules', () => {
  it('requires the essentials per type', () => {
    expect(validateRecord({ type: RecordType.FOOD, title: 'Milk' })).toContain('An expiration date is required.');
    expect(validateRecord({ type: RecordType.SUBSCRIPTION, title: 'Music' }).length).toBeGreaterThan(2);
    expect(validateRecord({ type: RecordType.BELONGING, title: '' })).toContain('Title is required.');
  });
  it('requires a trial end date for trials', () => {
    const f = { type: RecordType.SUBSCRIPTION, title: 'App', amountMinor: 1490, currency: 'USD', cycle: BillingCycle.MONTHLY, trial: true };
    expect(validateRecord(f)).toContain('A trial end date is required.');
    expect(validateRecord({ ...f, trialEnd: '2026-11-20' })).toEqual([]);
  });
  it('rejects impossible dates and reversed purchase dates', () => {
    expect(validateRecord({ type: RecordType.FOOD, title: 'Eggs', expires: '2026-02-30' })[0]).toMatch(/valid date/);
    expect(validateRecord({ type: RecordType.PURCHASE, title: 'TV', purchaseDate: '2026-10-10', returnBy: '2026-10-01' })).toContain('The return deadline is before the purchase date.');
  });
  it('needs a currency whenever there is an amount', () => {
    expect(validateRecord({ type: RecordType.PURCHASE, title: 'TV', amountMinor: 5000 })).toContain('A currency is required with an amount.');
  });
});
