import { ConflictException, Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { isValidTimezone } from '../../libs/dates';
import { LoginInput, RegisterInput } from '../../libs/dto/inputs';
import { Message } from '../../libs/messages';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('Member') private readonly members: Model<any>,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    if (await this.members.exists({ email })) throw new ConflictException(Message.EMAIL_TAKEN);
    const timezone = input.timezone && isValidTimezone(input.timezone) ? input.timezone : 'UTC';
    const member = await this.members.create({
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
      displayName: input.displayName.trim(),
      timezone,
    });
    return this.issue(member);
  }

  async login(input: LoginInput) {
    const member: any = await this.members.findOne({ email: input.email.trim().toLowerCase() }).select('+passwordHash');
    const ok = member ? await bcrypt.compare(input.password, member.passwordHash) : false;
    if (!ok) throw new UnauthorizedException(Message.BAD_CREDENTIALS);
    return this.issue(member);
  }

  async me(id: string) {
    const member = await this.members.findById(id).lean();
    if (!member) throw new NotFoundException(Message.NOT_FOUND);
    return member;
  }

  async setTimezone(id: string, timezone: string) {
    if (!isValidTimezone(timezone)) throw new BadRequestException(Message.BAD_TIMEZONE);
    const member = await this.members.findByIdAndUpdate(id, { timezone }, { new: true }).lean();
    if (!member) throw new NotFoundException(Message.NOT_FOUND);
    return member;
  }

  private async issue(member: any) {
    const accessToken = await this.jwt.signAsync({ sub: String(member._id), email: member.email });
    return { accessToken, member: member.toObject() };
  }
}
