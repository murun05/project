import { Injectable, Logger } from '@nestjs/common';

export interface DueNotice {
  email: string;
  title: string;
  kind: string;
  date: string;
  daysUntil: number;
}

/** Delivery channel. For now it only logs. Replace the body with an email or push provider. */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async deliver(n: DueNotice): Promise<void> {
    this.logger.log(`[would notify ${n.email}] ${n.kind} for "${n.title}" on ${n.date} (${n.daysUntil} days)`);
  }
}
