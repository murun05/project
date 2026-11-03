import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActionItem, ErrandResult, LifeRecord, ReminderResult } from '../../libs/dto/types';
import { AuthMember, SessionMember } from '../auth/auth-member.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { RemindersService } from './reminders.service';

@UseGuards(AuthGuard)
@Resolver()
export class RemindersResolver {
  constructor(private readonly reminders: RemindersService) {}

  @Query(() => [ActionItem])
  myActions(@AuthMember() m: SessionMember) {
    return this.reminders.actions(m.id);
  }

  @Query(() => [ActionItem])
  upcomingReminders(@AuthMember() m: SessionMember, @Args('days', { type: () => Int, defaultValue: 60 }) days: number) {
    return this.reminders.upcoming(m.id, days);
  }

  @Mutation(() => ReminderResult)
  completeReminder(@AuthMember() m: SessionMember, @Args('id', { type: () => ID }) id: string) {
    return this.reminders.complete(m.id, id);
  }

  @Mutation(() => ReminderResult)
  snoozeReminder(@AuthMember() m: SessionMember, @Args('id', { type: () => ID }) id: string) {
    return this.reminders.snoozeReminder(m.id, id);
  }

  @Mutation(() => ReminderResult)
  snoozeErrand(@AuthMember() m: SessionMember, @Args('id', { type: () => ID }) id: string) {
    return this.reminders.snoozeErrand(m.id, id);
  }

  @Mutation(() => LifeRecord)
  createErrandFromReminder(@AuthMember() m: SessionMember, @Args('reminderId', { type: () => ID }) reminderId: string) {
    return this.reminders.createErrand(m.id, reminderId);
  }

  @Mutation(() => ErrandResult)
  completeErrand(@AuthMember() m: SessionMember, @Args('id', { type: () => ID }) id: string, @Args('done') done: boolean) {
    return this.reminders.completeErrand(m.id, id, done);
  }
}
