import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecordsResolver } from './records.resolver';
import { RecordsService } from './records.service';

@Module({ imports: [AuthModule], providers: [RecordsService, RecordsResolver], exports: [RecordsService] })
export class RecordsModule {}
