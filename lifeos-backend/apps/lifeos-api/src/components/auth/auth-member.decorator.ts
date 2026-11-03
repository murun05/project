import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface SessionMember {
  id: string;
  email: string;
}
export const AuthMember = createParamDecorator((_data: unknown, context: ExecutionContext): SessionMember => {
  return GqlExecutionContext.create(context).getContext().req.member;
});
