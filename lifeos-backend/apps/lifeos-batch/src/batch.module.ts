import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../../lifeos-api/src/database/database.module';
import { BatchService } from './batch.service';
import { NotificationService } from './notification.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ScheduleModule.forRoot(), DatabaseModule],
  providers: [BatchService, NotificationService],
})
export class BatchModule {}
