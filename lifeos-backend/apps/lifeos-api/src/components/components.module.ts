import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RecordsModule } from './records/records.module';
import { RemindersModule } from './reminders/reminders.module';
import { ShoppingModule } from './shopping/shopping.module';

@Module({ imports: [AuthModule, RecordsModule, RemindersModule, ShoppingModule] })
export class ComponentsModule {}
