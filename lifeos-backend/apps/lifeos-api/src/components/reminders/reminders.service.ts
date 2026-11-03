import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { addDays, diffDays, todayIn } from '../../libs/dates';
import { ActionSource, LinkRelation, RecordType, ReminderKind } from '../../libs/enums';
import { Message } from '../../libs/messages';
import { ERRAND_LEAD_DAYS, isSurfaced, leadDays, nextRenewal } from '../../libs/reminder-rules';
import { RecordsService } from '../records/records.service';

@Injectable()
export class RemindersService {
  constructor(
    @InjectModel('LifeRecord') private readonly records: Model<any>,
    @InjectModel('Reminder') private readonly reminders: Model<any>,
    @InjectModel('RecordLink') private readonly links: Model<any>,
    @InjectModel('Member') private readonly members: Model<any>,
    private readonly recordsService: RecordsService,
  ) {}

  private async today(memberId: string): Promise<string> {
    const m: any = await this.members.findById(memberId).lean();
    return todayIn(m?.timezone ?? 'UTC');
  }

  private action(rem: any, rec: any, today: string) {
    const n = diffDays(today, rem.date);
    const trial = rem.kind === ReminderKind.TRIAL;
    return {
      recordId: rec._id,
      reminderId: rem._id,
      title: rec.title,
      recordType: rec.type,
      source: ActionSource.REMINDER,
      kind: rem.kind,
      date: rem.date,
      daysUntil: n,
      urgent: n <= 1,
      chargeMinor: trial ? rec.amountMinor ?? null : null,
      currency: trial ? rec.currency ?? null : null,
    };
  }

  private async openReminders(memberId: string) {
    const rems: any[] = await this.reminders.find({ memberId, done: false }).lean();
    const recs: any[] = await this.records.find({ _id: { $in: rems.map((r) => r.recordId) }, archived: false }).lean();
    const byId = new Map(recs.map((r) => [String(r._id), r]));
    return rems.map((rem) => ({ rem, rec: byId.get(String(rem.recordId)) })).filter((x) => x.rec);
  }

  /** "Your next actions": reminders inside their lead window plus errands due soon, soonest first. */
  async actions(memberId: string) {
    const today = await this.today(memberId);
    const out: any[] = [];
    for (const { rem, rec } of await this.openReminders(memberId)) {
      if (isSurfaced({ date: rem.date, done: false, snoozeUntil: rem.snoozeUntil }, today, leadDays(rem.kind, rec.remindDays))) out.push(this.action(rem, rec, today));
    }
    const errands: any[] = await this.records.find({ memberId, type: RecordType.ERRAND, archived: false, done: false, dueDate: { $ne: null } }).lean();
    for (const e of errands) {
      if (!isSurfaced({ date: e.dueDate, done: false, snoozeUntil: e.snoozeUntil }, today, ERRAND_LEAD_DAYS)) continue;
      const n = diffDays(today, e.dueDate);
      out.push({ recordId: e._id, title: e.title, recordType: e.type, source: ActionSource.ERRAND, date: e.dueDate, daysUntil: n, urgent: n <= 1 });
    }
    return out.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  /** Every open reminder inside a window, regardless of lead time. Used for the Plan view. */
  async upcoming(memberId: string, days: number) {
    const today = await this.today(memberId);
    return (await this.openReminders(memberId))
      .map(({ rem, rec }) => this.action(rem, rec, today))
      .filter((a) => a.daysUntil <= days && a.daysUntil >= -30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  async complete(memberId: string, id: string) {
    const rem = await this.ownReminder(memberId, id);
    const rec: any = await this.records.findOne({ _id: rem.recordId, memberId });
    if (!rec) throw new NotFoundException(Message.NOT_FOUND);
    rem.done = true;
    rem.doneAt = new Date();
    await rem.save();

    let message = 'Marked as done.';
    if (rem.kind === ReminderKind.RENEWAL) {
      rec.renewal = nextRenewal(rem.date, rec.cycle);
      await rec.save();
      await this.recordsService.syncReminders(rec);
      message = `Renewal recorded. Next renewal is ${rec.renewal}.`;
    } else if (rem.kind === ReminderKind.TRIAL) {
      rec.trial = false;
      rec.renewal = rem.date;
      await rec.save();
      await this.recordsService.syncReminders(rec);
      message = `Trial handled. The first payment date is ${rem.date}. Archive the subscription if you cancelled it.`;
    }
    return { message, record: rec.toObject() };
  }

  async snoozeReminder(memberId: string, id: string) {
    const rem = await this.ownReminder(memberId, id);
    rem.snoozeUntil = addDays(await this.today(memberId), 1);
    await rem.save();
    return { message: `Snoozed until ${rem.snoozeUntil}.` };
  }

  async snoozeErrand(memberId: string, id: string) {
    const rec = await this.recordsService.own(memberId, id);
    rec.snoozeUntil = addDays(await this.today(memberId), 1);
    await rec.save();
    return { message: `Snoozed until ${rec.snoozeUntil}.`, record: rec.toObject() };
  }

  /** "Make errand" on a return or warranty reminder. Reuses an existing linked errand if there is one. */
  async createErrand(memberId: string, reminderId: string) {
    const rem = await this.ownReminder(memberId, reminderId);
    if (rem.kind !== ReminderKind.RETURN && rem.kind !== ReminderKind.WARRANTY) throw new NotFoundException(Message.NOT_FOUND);
    const rec: any = await this.recordsService.own(memberId, String(rem.recordId));
    const existing: any[] = await this.links.find({ memberId, toId: rec._id, relation: LinkRelation.CREATED_FOR }).lean();
    if (existing.length) {
      const e: any = await this.records.findOne({ _id: { $in: existing.map((l) => l.fromId) }, type: RecordType.ERRAND, archived: false }).lean();
      if (e) return e;
    }
    const errand = await this.records.create({
      memberId,
      type: RecordType.ERRAND,
      title: `${rem.kind === ReminderKind.RETURN ? 'Return' : 'Warranty service:'} ${rec.title}`,
      dueDate: rem.date,
    });
    await this.recordsService.link(memberId, errand._id, rec._id, LinkRelation.CREATED_FOR);
    return errand.toObject();
  }

  /** Finishing an errand never completes anything else. It only suggests the linked return, so the client can ask. */
  async completeErrand(memberId: string, id: string, done: boolean) {
    const errand: any = await this.recordsService.own(memberId, id);
    if (errand.type !== RecordType.ERRAND) throw new NotFoundException(Message.NOT_FOUND);
    errand.done = done;
    await errand.save();
    let suggestedReminderId: any;
    if (done) {
      const link: any = await this.links.findOne({ memberId, fromId: errand._id, relation: LinkRelation.CREATED_FOR }).lean();
      if (link) {
        const open: any = await this.reminders.findOne({ memberId, recordId: link.toId, kind: ReminderKind.RETURN, done: false }).lean();
        suggestedReminderId = open?._id;
      }
    }
    return { errand: errand.toObject(), suggestedReminderId };
  }

  private async ownReminder(memberId: string, id: string): Promise<any> {
    if (!isValidObjectId(id)) throw new NotFoundException(Message.NOT_FOUND);
    const rem = await this.reminders.findOne({ _id: id, memberId, done: false });
    if (!rem) throw new NotFoundException(Message.NOT_FOUND);
    return rem;
  }
}
