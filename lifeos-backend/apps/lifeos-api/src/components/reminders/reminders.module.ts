import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecordsModule } from '../records/records.module';
import { RemindersResolver } from './reminders.resolver';
import { RemindersService } from './reminders.service';

@Module({ imports: [AuthModule, RecordsModule], providers: [RemindersService, RemindersResolver] })
export class RemindersModule {}
