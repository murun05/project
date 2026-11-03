import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { Message } from '../../libs/messages';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = GqlExecutionContext.create(context).getContext().req;
    const header: string | undefined = req?.headers?.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    try {
      const payload = await this.jwt.verifyAsync(header.slice(7));
      req.member = { id: String(payload.sub), email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }
  }
}
