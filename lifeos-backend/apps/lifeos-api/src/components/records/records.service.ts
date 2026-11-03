import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateRecordInput, PurchaseOptionsInput, RecordFieldsInput, RecordsFilterInput, UpdateRecordInput } from '../../libs/dto/inputs';
import { LinkRelation, RecordType, ReminderKind } from '../../libs/enums';
import { Message } from '../../libs/messages';
import { monthlyMinor, toMinor, yearlyMinor } from '../../libs/money';
import { validateRecord } from '../../libs/record-rules';
import { desiredReminders } from '../../libs/reminder-rules';

const PLAIN_KEYS = ['notes', 'merchant', 'category', 'location', 'serial', 'qty', 'currency', 'purchaseDate', 'returnBy', 'warrantyEnd', 'expires', 'opened', 'renewal', 'trialEnd', 'dueDate', 'cycle', 'docType', 'remindDays', 'trial', 'unused'];
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class RecordsService {
  constructor(
    @InjectModel('LifeRecord') private readonly records: Model<any>,
    @InjectModel('Reminder') private readonly reminders: Model<any>,
    @InjectModel('RecordLink') private readonly links: Model<any>,
  ) {}

  /** Loads a record only if it belongs to this member. */
  async own(memberId: string, id: string): Promise<any> {
    if (!isValidObjectId(id)) throw new NotFoundException(Message.NOT_FOUND);
    const rec = await this.records.findOne({ _id: id, memberId });
    if (!rec) throw new NotFoundException(Message.NOT_FOUND);
    return rec;
  }

  list(memberId: string, filter?: RecordsFilterInput) {
    const q: Record<string, any> = { memberId, archived: filter?.archived ?? false };
    if (filter?.type) q.type = filter.type;
    if (filter?.search?.trim()) q.title = { $regex: escapeRegex(filter.search.trim()), $options: 'i' };
    return this.records.find(q).sort({ updatedAt: -1 }).limit(500).lean();
  }

  async detail(memberId: string, id: string) {
    const rec = await this.own(memberId, id);
    const links: any[] = await this.links.find({ memberId, $or: [{ fromId: rec._id }, { toId: rec._id }] }).lean();
    const otherId = (l: any) => (String(l.fromId) === String(rec._id) ? l.toId : l.fromId);
    const others: any[] = await this.records.find({ memberId, _id: { $in: links.map(otherId) } }).lean();
    const byId = new Map(others.map((o) => [String(o._id), o]));
    const linked = links.map((l) => ({ relation: l.relation, record: byId.get(String(otherId(l))) })).filter((x) => x.record);
    const reminders = await this.reminders.find({ memberId, recordId: rec._id, done: false }).sort({ date: 1 }).lean();
    return { record: rec.toObject(), linked, reminders };
  }

  async create(memberId: string, input: CreateRecordInput, options?: PurchaseOptionsInput) {
    const fields = this.fromInput(input);
    const problems = validateRecord({ type: input.type, ...fields });
    if (problems.length) throw new BadRequestException(problems.join(' '));
    if (input.linkToId) await this.own(memberId, input.linkToId);

    const rec = await this.records.create({ memberId, type: input.type, ...fields });

    // A purchase only creates the reminders the member chose; everything else follows its dates.
    let allow: ReminderKind[] | undefined;
    if (input.type === RecordType.PURCHASE) {
      allow = [];
      if (options?.returnReminder ?? true) allow.push(ReminderKind.RETURN);
      if (options?.warrantyReminder ?? true) allow.push(ReminderKind.WARRANTY);
    }
    await this.syncReminders(rec, allow);
    if (input.linkToId) await this.link(memberId, rec._id, input.linkToId, LinkRelation.LINKED_TO);
    if (input.type === RecordType.PURCHASE) await this.purchaseExtras(memberId, rec, options);
    return rec.toObject();
  }

  async update(memberId: string, input: UpdateRecordInput) {
    const rec = await this.own(memberId, input.id);
    const before = rec.toObject();
    const fields = this.fromInput(input, before.currency);
    const merged = { ...before, ...fields };
    const problems = validateRecord(merged);
    if (problems.length) throw new BadRequestException(problems.join(' '));

    rec.set(fields);
    await rec.save();

    // Only add reminders that already existed or whose date was newly filled in. Never surprise the member.
    const existing: any[] = await this.reminders.find({ recordId: rec._id }).lean();
    const had = new Set<string>(existing.map((r) => r.kind));
    const wasWanted = new Set<string>(desiredReminders(before).map((d) => d.kind));
    const allow = desiredReminders(merged).map((d) => d.kind).filter((k) => had.has(k) || !wasWanted.has(k));
    await this.syncReminders(rec, allow);
    return rec.toObject();
  }

  /** Archiving hides a record; linked records and documents are left untouched. */
  async setArchived(memberId: string, id: string, archived: boolean) {
    const rec = await this.own(memberId, id);
    rec.archived = archived;
    await rec.save();
    return rec.toObject();
  }

  /** Keeps reminders in step with a record's dates. `allow` limits which reminder kinds may be created. */
  async syncReminders(rec: any, allow?: ReminderKind[]) {
    const desired = desiredReminders(rec);
    const wanted = new Set<string>(desired.map((d) => d.kind));
    const open: any[] = await this.reminders.find({ recordId: rec._id, done: false });
    for (const r of open) if (!wanted.has(r.kind)) await r.deleteOne();
    for (const d of desired) {
      if (allow && !allow.includes(d.kind)) continue;
      const cur = open.find((r) => r.kind === d.kind);
      if (cur) {
        if (cur.date !== d.date) {
          cur.date = d.date;
          cur.deliveredAt = null;
          await cur.save();
        }
      } else {
        await this.reminders.create({ memberId: rec.memberId, recordId: rec._id, kind: d.kind, date: d.date });
      }
    }
  }

  async link(memberId: string, fromId: any, toId: any, relation: LinkRelation) {
    await this.links.updateOne({ memberId, fromId, toId, relation }, { $setOnInsert: { memberId, fromId, toId, relation } }, { upsert: true });
  }

  async subscriptionSummary(memberId: string) {
    const subs: any[] = await this.records.find({ memberId, type: RecordType.SUBSCRIPTION, archived: false }).lean();
    const byCurrency = new Map<string, { yearly: number; unused: number }>();
    let activeTrials = 0;
    for (const s of subs) {
      if (s.trial) {
        activeTrials++;
        continue;
      }
      if (s.amountMinor == null || !s.currency) continue;
      const y = yearlyMinor(s.amountMinor, s.cycle);
      const cur = byCurrency.get(s.currency) ?? { yearly: 0, unused: 0 };
      cur.yearly += y;
      if (s.unused) cur.unused += y;
      byCurrency.set(s.currency, cur);
    }
    return {
      activeTrials,
      perCurrency: [...byCurrency.entries()].map(([currency, v]) => ({ currency, yearlyMinor: v.yearly, monthlyMinor: monthlyMinor(v.yearly), unusedYearlyMinor: v.unused })),
    };
  }

  private async purchaseExtras(memberId: string, rec: any, o?: PurchaseOptionsInput) {
    if (o?.receiptName?.trim()) {
      const doc = await this.records.create({ memberId, type: RecordType.DOCUMENT, title: o.receiptName.trim(), docType: 'RECEIPT' });
      await this.link(memberId, doc._id, rec._id, LinkRelation.RECEIPT_FOR);
    }
    if (o?.trackInStuff ?? true) {
      const item = await this.records.create({ memberId, type: RecordType.BELONGING, title: rec.title });
      await this.link(memberId, item._id, rec._id, LinkRelation.BOUGHT_IN);
    }
    if (o?.createReturnErrand && rec.returnBy) {
      const errand = await this.records.create({ memberId, type: RecordType.ERRAND, title: `Return ${rec.title}`, dueDate: rec.returnBy });
      await this.link(memberId, errand._id, rec._id, LinkRelation.CREATED_FOR);
    }
  }

  /** Maps GraphQL input to stored fields. An empty string clears a field. Money becomes integer minor units. */
  private fromInput(i: RecordFieldsInput, currencyFallback?: string): Record<string, any> {
    const out: Record<string, any> = {};
    for (const k of PLAIN_KEYS) {
      const v = (i as any)[k];
      if (v !== undefined) out[k] = v === '' ? null : v;
    }
    if (i.title !== undefined) out.title = i.title.trim();
    if (i.amount !== undefined) {
      if (i.amount === '') {
        out.amountMinor = null;
      } else {
        const currency = i.currency || currencyFallback;
        if (!currency) throw new BadRequestException('A currency is required with an amount.');
        try {
          out.amountMinor = toMinor(i.amount, currency);
        } catch (e) {
          throw new BadRequestException((e as Error).message);
        }
      }
    }
    return out;
  }
}
