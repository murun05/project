import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { ActionSource, BillingCycle, DocType, LinkRelation, RecordType, ReminderKind } from '../enums';

@ObjectType()
export class Member {
  @Field(() => ID) _id: string;
  @Field() email: string;
  @Field() displayName: string;
  @Field() timezone: string;
}

@ObjectType()
export class AuthPayload {
  @Field() accessToken: string;
  @Field(() => Member) member: Member;
}

@ObjectType()
export class LifeRecord {
  @Field(() => ID) _id: string;
  @Field(() => RecordType) type: RecordType;
  @Field() title: string;
  @Field() archived: boolean;
  @Field() done: boolean;
  @Field(() => String, { nullable: true }) notes?: string;
  @Field(() => String, { nullable: true }) merchant?: string;
  @Field(() => Float, { nullable: true }) amountMinor?: number;
  @Field(() => String, { nullable: true }) currency?: string;
  @Field(() => String, { nullable: true }) purchaseDate?: string;
  @Field(() => String, { nullable: true }) returnBy?: string;
  @Field(() => String, { nullable: true }) warrantyEnd?: string;
  @Field(() => String, { nullable: true }) category?: string;
  @Field(() => String, { nullable: true }) location?: string;
  @Field(() => String, { nullable: true }) serial?: string;
  @Field(() => String, { nullable: true }) qty?: string;
  @Field(() => String, { nullable: true }) expires?: string;
  @Field(() => String, { nullable: true }) opened?: string;
  @Field(() => BillingCycle, { nullable: true }) cycle?: BillingCycle;
  @Field(() => String, { nullable: true }) renewal?: string;
  @Field(() => Int, { nullable: true }) remindDays?: number;
  @Field(() => Boolean, { nullable: true }) trial?: boolean;
  @Field(() => String, { nullable: true }) trialEnd?: string;
  @Field(() => Boolean, { nullable: true }) unused?: boolean;
  @Field(() => DocType, { nullable: true }) docType?: DocType;
  @Field(() => String, { nullable: true }) dueDate?: string;
  @Field(() => Date, { nullable: true }) createdAt?: Date;
  @Field(() => Date, { nullable: true }) updatedAt?: Date;
}

@ObjectType()
export class Reminder {
  @Field(() => ID) _id: string;
  @Field(() => ID) recordId: string;
  @Field(() => ReminderKind) kind: ReminderKind;
  @Field() date: string;
  @Field() done: boolean;
  @Field(() => String, { nullable: true }) snoozeUntil?: string;
  @Field(() => Date, { nullable: true }) deliveredAt?: Date;
}

@ObjectType()
export class LinkedRecord {
  @Field(() => LinkRelation) relation: LinkRelation;
  @Field(() => LifeRecord) record: LifeRecord;
}

@ObjectType()
export class RecordDetail {
  @Field(() => LifeRecord) record: LifeRecord;
  @Field(() => [LinkedRecord]) linked: LinkedRecord[];
  @Field(() => [Reminder]) reminders: Reminder[];
}

@ObjectType()
export class ActionItem {
  @Field(() => ID) recordId: string;
  @Field(() => ID, { nullable: true }) reminderId?: string;
  @Field() title: string;
  @Field(() => RecordType) recordType: RecordType;
  @Field(() => ActionSource) source: ActionSource;
  @Field(() => ReminderKind, { nullable: true }) kind?: ReminderKind;
  @Field() date: string;
  @Field(() => Int) daysUntil: number;
  @Field() urgent: boolean;
  /** For free trials: the amount that will be charged when the trial ends. */
  @Field(() => Float, { nullable: true }) chargeMinor?: number;
  @Field(() => String, { nullable: true }) currency?: string;
}

@ObjectType()
export class ReminderResult {
  @Field() message: string;
  @Field(() => LifeRecord, { nullable: true }) record?: LifeRecord;
}

@ObjectType()
export class ErrandResult {
  @Field(() => LifeRecord) errand: LifeRecord;
  /** Set when finishing this errand could complete a linked return. The client should ask the member first. */
  @Field(() => ID, { nullable: true }) suggestedReminderId?: string;
}

@ObjectType()
export class OwnedMatch {
  @Field(() => ID) recordId: string;
  @Field() title: string;
  @Field(() => RecordType) recordType: RecordType;
  @Field() message: string;
}

@ObjectType()
export class ShoppingItem {
  @Field(() => ID) _id: string;
  @Field() text: string;
  @Field() done: boolean;
  @Field(() => [OwnedMatch]) matches: OwnedMatch[];
}

@ObjectType()
export class CurrencySummary {
  @Field() currency: string;
  @Field(() => Float) monthlyMinor: number;
  @Field(() => Float) yearlyMinor: number;
  @Field(() => Float) unusedYearlyMinor: number;
}

@ObjectType()
export class SubscriptionSummary {
  @Field(() => [CurrencySummary]) perCurrency: CurrencySummary[];
  @Field(() => Int) activeTrials: number;
}
