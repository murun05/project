import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRecordInput, PurchaseOptionsInput, RecordsFilterInput, UpdateRecordInput } from '../../libs/dto/inputs';
import { LifeRecord, RecordDetail, SubscriptionSummary } from '../../libs/dto/types';
import { AuthMember, SessionMember } from '../auth/auth-member.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { RecordsService } from './records.service';

@UseGuards(AuthGuard)
@Resolver()
export class RecordsResolver {
  constructor(private readonly records: RecordsService) {}

  @Query(() => [LifeRecord], { name: 'records' })
  listRecords(@AuthMember() m: SessionMember, @Args('filter', { nullable: true }) filter?: RecordsFilterInput) {
    return this.records.list(m.id, filter);
  }

  @Query(() => RecordDetail)
  recordDetail(@AuthMember() m: SessionMember, @Args('id', { type: () => ID }) id: string) {
    return this.records.detail(m.id, id);
  }

  @Query(() => SubscriptionSummary)
  subscriptionSummary(@AuthMember() m: SessionMember) {
    return this.records.subscriptionSummary(m.id);
  }

  @Mutation(() => LifeRecord)
  createRecord(@AuthMember() m: SessionMember, @Args('input') input: CreateRecordInput, @Args('options', { nullable: true }) options?: PurchaseOptionsInput) {
    return this.records.create(m.id, input, options);
  }

  @Mutation(() => LifeRecord)
  updateRecord(@AuthMember() m: SessionMember, @Args('input') input: UpdateRecordInput) {
    return this.records.update(m.id, input);
  }

  @Mutation(() => LifeRecord)
  setRecordArchived(@AuthMember() m: SessionMember, @Args('id', { type: () => ID }) id: string, @Args('archived') archived: boolean) {
    return this.records.setArchived(m.id, id, archived);
  }
}
