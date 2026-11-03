import { isIsoDate } from './dates';
import { BillingCycle, RecordType } from './enums';

export interface RecordFields {
  type: RecordType;
  title?: string | null;
  amountMinor?: number | null;
  currency?: string | null;
  cycle?: BillingCycle | string | null;
  renewal?: string | null;
  trial?: boolean | null;
  trialEnd?: string | null;
  expires?: string | null;
  returnBy?: string | null;
  warrantyEnd?: string | null;
  purchaseDate?: string | null;
  dueDate?: string | null;
  opened?: string | null;
  remindDays?: number | null;
}
const DATE_KEYS = ['renewal', 'trialEnd', 'expires', 'returnBy', 'warrantyEnd', 'purchaseDate', 'dueDate', 'opened'] as const;

/** Returns human-readable problems; an empty list means the record is valid. */
export function validateRecord(f: RecordFields): string[] {
  const e: string[] = [];
  if (!f.title || !f.title.trim()) e.push('Title is required.');
  for (const k of DATE_KEYS) {
    const v = f[k];
    if (v && !isIsoDate(v)) e.push(`${k} must be a valid date (YYYY-MM-DD).`);
  }
  if (f.remindDays != null && (f.remindDays < 0 || f.remindDays > 60)) e.push('remindDays must be between 0 and 60.');
  if (f.amountMinor != null && !f.currency) e.push('A currency is required with an amount.');
  if (f.type === RecordType.SUBSCRIPTION) {
    if (f.amountMinor == null) e.push('A price is required.');
    if (!f.cycle) e.push('A billing cycle is required.');
    if (f.trial) {
      if (!f.trialEnd) e.push('A trial end date is required.');
    } else if (!f.renewal) {
      e.push('A next renewal date is required.');
    }
  }
  if (f.type === RecordType.FOOD && !f.expires) e.push('An expiration date is required.');
  if (f.type === RecordType.PURCHASE) {
    if (f.purchaseDate && f.returnBy && f.returnBy < f.purchaseDate) e.push('The return deadline is before the purchase date.');
    if (f.purchaseDate && f.warrantyEnd && f.warrantyEnd < f.purchaseDate) e.push('The warranty ends before the purchase date.');
  }
  return e;
}
