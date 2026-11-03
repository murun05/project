import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { diffDays, todayIn } from '../../lifeos-api/src/libs/dates';
import { isSurfaced, leadDays } from '../../lifeos-api/src/libs/reminder-rules';
import { NotificationService } from './notification.service';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    @InjectModel('Reminder') private readonly reminders: Model<any>,
    @InjectModel('LifeRecord') private readonly records: Model<any>,
    @InjectModel('Member') private readonly members: Model<any>,
    private readonly notifier: NotificationService,
  ) {}

  /**
   * Hourly: finds open reminders that have entered their lead window (in each member's own timezone)
   * and have not been delivered yet, sends them once, and stamps deliveredAt.
   */
  @Cron(CronExpression.EVERY_HOUR)
  public async batchDeliverReminders(): Promise<number> {
    this.logger.log('batchDeliverReminders: START');
    const pending: any[] = await this.reminders.find({ done: false, deliveredAt: null }).lean();
    const members = new Map<string, any>();
    let delivered = 0;
    for (const rem of pending) {
      const rec: any = await this.records.findOne({ _id: rem.recordId, archived: false }).lean();
      if (!rec) continue;
      const key = String(rem.memberId);
      if (!members.has(key)) members.set(key, await this.members.findById(rem.memberId).lean());
      const member = members.get(key);
      if (!member) continue;
      const today = todayIn(member.timezone ?? 'UTC');
      if (!isSurfaced({ date: rem.date, done: false, snoozeUntil: rem.snoozeUntil }, today, leadDays(rem.kind, rec.remindDays))) continue;
      await this.notifier.deliver({ email: member.email, title: rec.title, kind: rem.kind, date: rem.date, daysUntil: diffDays(today, rem.date) });
      await this.reminders.updateOne({ _id: rem._id }, { deliveredAt: new Date() });
      delivered++;
    }
    this.logger.log(`batchDeliverReminders: DONE, delivered ${delivered}`);
    return delivered;
  }
}
