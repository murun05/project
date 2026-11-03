import { registerEnumType } from '@nestjs/graphql';

export enum RecordType { PURCHASE = 'PURCHASE', BELONGING = 'BELONGING', FOOD = 'FOOD', SUBSCRIPTION = 'SUBSCRIPTION', DOCUMENT = 'DOCUMENT', ERRAND = 'ERRAND' }
export enum ReminderKind { RETURN = 'RETURN', WARRANTY = 'WARRANTY', EXPIRY = 'EXPIRY', RENEWAL = 'RENEWAL', TRIAL = 'TRIAL' }
export enum BillingCycle { MONTHLY = 'MONTHLY', YEARLY = 'YEARLY' }
export enum DocType { RECEIPT = 'RECEIPT', WARRANTY = 'WARRANTY', MANUAL = 'MANUAL', OTHER = 'OTHER' }
export enum LinkRelation { RECEIPT_FOR = 'RECEIPT_FOR', BOUGHT_IN = 'BOUGHT_IN', CREATED_FOR = 'CREATED_FOR', LINKED_TO = 'LINKED_TO' }
export enum ActionSource { REMINDER = 'REMINDER', ERRAND = 'ERRAND' }

registerEnumType(RecordType, { name: 'RecordType' });
registerEnumType(ReminderKind, { name: 'ReminderKind' });
registerEnumType(BillingCycle, { name: 'BillingCycle' });
registerEnumType(DocType, { name: 'DocType' });
registerEnumType(LinkRelation, { name: 'LinkRelation' });
registerEnumType(ActionSource, { name: 'ActionSource' });
