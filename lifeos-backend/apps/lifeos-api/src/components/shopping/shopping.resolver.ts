import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { ArgsType, Field } from '@nestjs/graphql';
import { OwnedMatch, ShoppingItem } from '../../libs/dto/types';
import { AuthMember, SessionMember } from '../auth/auth-member.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { ShoppingService } from './shopping.service';

@ArgsType()
class TextArgs {
  @Field() @IsString() @Length(1, 100) text: string;
}

@UseGuards(AuthGuard)
@Resolver()
export class ShoppingResolver {
  constructor(private readonly shopping: ShoppingService) {}

  @Query(() => [ShoppingItem])
  shoppingList(@AuthMember() m: SessionMember) {
    return this.shopping.list(m.id);
  }

  @Query(() => [OwnedMatch])
  ownershipCheck(@AuthMember() m: SessionMember, @Args() args: TextArgs) {
    return this.shopping.check(m.id, args.text);
  }

  @Mutation(() => ShoppingItem)
  addShoppingItem(@AuthMember() m: SessionMember, @Args() args: TextArgs) {
    return this.shopping.add(m.id, args.text);
  }

  @Mutation(() => ShoppingItem)
  setShoppingItemDone(@AuthMember() m: SessionMember, @Args('id', { type: () => ID }) id: string, @Args('done') done: boolean) {
    return this.shopping.setDone(m.id, id, done);
  }

  @Mutation(() => Boolean)
  removeShoppingItem(@AuthMember() m: SessionMember, @Args('id', { type: () => ID }) id: string) {
    return this.shopping.remove(m.id, id);
  }
}
