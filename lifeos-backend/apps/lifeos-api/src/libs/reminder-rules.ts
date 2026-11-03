import { addMonths, addYears, diffDays } from './dates';
import { BillingCycle, RecordType, ReminderKind } from './enums';

export const ERRAND_LEAD_DAYS = 3;
const DEFAULT_LEAD: Record<ReminderKind, number> = {
  [ReminderKind.RETURN]: 7,
  [ReminderKind.WARRANTY]: 30,
  [ReminderKind.EXPIRY]: 3,
  [ReminderKind.TRIAL]: 7,
  [ReminderKind.RENEWAL]: 3,
};

export interface ReminderSource {
  type: RecordType;
  returnBy?: string | null;
  warrantyEnd?: string | null;
  expires?: string | null;
  renewal?: string | null;
  trial?: boolean | null;
  trialEnd?: string | null;
}

/** How many days before the date a reminder starts showing up. */
export function leadDays(kind: ReminderKind, remindDays?: number | null): number {
  return kind === ReminderKind.RENEWAL && remindDays != null ? remindDays : DEFAULT_LEAD[kind];
}

/** Which reminders a record should have, derived from its dates. */
export function desiredReminders(r: ReminderSource): { kind: ReminderKind; date: string }[] {
  const out: { kind: ReminderKind; date: string }[] = [];
  if (r.type === RecordType.PURCHASE) {
    if (r.returnBy) out.push({ kind: ReminderKind.RETURN, date: r.returnBy });
    if (r.warrantyEnd) out.push({ kind: ReminderKind.WARRANTY, date: r.warrantyEnd });
  } else if (r.type === RecordType.FOOD) {
    if (r.expires) out.push({ kind: ReminderKind.EXPIRY, date: r.expires });
  } else if (r.type === RecordType.SUBSCRIPTION) {
    if (r.trial) {
      if (r.trialEnd) out.push({ kind: ReminderKind.TRIAL, date: r.trialEnd });
    } else if (r.renewal) {
      out.push({ kind: ReminderKind.RENEWAL, date: r.renewal });
    }
  }
  return out;
}

export function isSurfaced(a: { date: string; done: boolean; snoozeUntil?: string | null }, today: string, lead: number): boolean {
  if (a.done) return false;
  if (a.snoozeUntil && a.snoozeUntil > today) return false;
  return diffDays(today, a.date) <= lead;
}

export function nextRenewal(date: string, cycle: BillingCycle | string): string {
  return cycle === BillingCycle.YEARLY ? addYears(date, 1) : addMonths(date, 1);
}
