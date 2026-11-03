import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LoginInput, RegisterInput } from '../../libs/dto/inputs';
import { AuthPayload, Member } from '../../libs/dto/types';
import { AuthMember, SessionMember } from './auth-member.decorator';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Resolver()
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => AuthPayload)
  register(@Args('input') input: RegisterInput) {
    return this.auth.register(input);
  }

  @Mutation(() => AuthPayload)
  login(@Args('input') input: LoginInput) {
    return this.auth.login(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => Member)
  me(@AuthMember() member: SessionMember) {
    return this.auth.me(member.id);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  setTimezone(@AuthMember() member: SessionMember, @Args('timezone') timezone: string) {
    return this.auth.setTimezone(member.id, timezone);
  }
}
