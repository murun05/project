import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('SECRET_TOKEN'),
        signOptions: { expiresIn: 60 * 60 * 24 * 7 },
      }),
    }),
  ],
  providers: [AuthService, AuthResolver, AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
