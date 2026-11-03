import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import LifeRecordSchema from '../schemas/LifeRecord.model';
import MemberSchema from '../schemas/Member.model';
import RecordLinkSchema from '../schemas/RecordLink.model';
import ReminderSchema from '../schemas/Reminder.model';
import ShoppingItemSchema from '../schemas/ShoppingItem.model';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ uri: config.getOrThrow<string>('MONGO_URL') }),
    }),
    MongooseModule.forFeature([
      { name: 'Member', schema: MemberSchema },
      { name: 'LifeRecord', schema: LifeRecordSchema },
      { name: 'Reminder', schema: ReminderSchema },
      { name: 'RecordLink', schema: RecordLinkSchema },
      { name: 'ShoppingItem', schema: ShoppingItemSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
