import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { RecordType } from '../../libs/enums';
import { matchesOwned } from '../../libs/match';
import { Message } from '../../libs/messages';

function describe(r: any): string {
  if (r.type === RecordType.FOOD) {
    const bits = [r.qty || 'some'];
    if (r.location) bits.push(`in ${r.location}`);
    if (r.expires) bits.push(`expires ${r.expires}`);
    return `You already have “${r.title}”: ${bits.join(', ')}.`;
  }
  return `You already own “${r.title}”${r.location ? `, stored in ${r.location}` : ''}.`;
}

@Injectable()
export class ShoppingService {
  constructor(
    @InjectModel('ShoppingItem') private readonly items: Model<any>,
    @InjectModel('LifeRecord') private readonly records: Model<any>,
  ) {}

  private async owned(memberId: string): Promise<any[]> {
    return this.records.find({ memberId, archived: false, type: { $in: [RecordType.FOOD, RecordType.BELONGING] } }).lean();
  }
  private matches(text: string, owned: any[]) {
    return owned.filter((r) => matchesOwned(text, r.title)).map((r) => ({ recordId: r._id, title: r.title, recordType: r.type, message: describe(r) }));
  }

  /** "Do I already own this?" for a single item, without adding it to the list. */
  async check(memberId: string, text: string) {
    return this.matches(text, await this.owned(memberId));
  }

  async list(memberId: string) {
    const owned = await this.owned(memberId);
    const items: any[] = await this.items.find({ memberId }).sort({ createdAt: 1 }).limit(300).lean();
    return items.map((i) => ({ ...i, matches: i.done ? [] : this.matches(i.text, owned) }));
  }

  async add(memberId: string, text: string) {
    const item = await this.items.create({ memberId, text: text.trim() });
    return { ...item.toObject(), matches: this.matches(item.text, await this.owned(memberId)) };
  }

  async setDone(memberId: string, id: string, done: boolean) {
    const item = await this.items.findOneAndUpdate({ _id: this.valid(id), memberId }, { done }, { new: true }).lean();
    if (!item) throw new NotFoundException(Message.NOT_FOUND);
    return { ...item, matches: [] };
  }

  async remove(memberId: string, id: string) {
    const res = await this.items.deleteOne({ _id: this.valid(id), memberId });
    return res.deletedCount === 1;
  }

  private valid(id: string): string {
    if (!isValidObjectId(id)) throw new NotFoundException(Message.NOT_FOUND);
    return id;
  }
}
