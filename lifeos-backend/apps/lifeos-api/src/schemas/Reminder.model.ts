import { Schema } from 'mongoose';
import { ReminderKind } from '../libs/enums';

const ReminderSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    recordId: { type: Schema.Types.ObjectId, ref: 'LifeRecord', required: true, index: true },
    kind: { type: String, enum: Object.values(ReminderKind), required: true },
    date: { type: String, required: true }, // the due date, 'YYYY-MM-DD'
    done: { type: Boolean, default: false },
    doneAt: Date,
    snoozeUntil: String,
    deliveredAt: Date, // set by the batch job once a notification was sent
  },
  { timestamps: true, collection: 'reminders' },
);
ReminderSchema.index({ memberId: 1, done: 1, date: 1 });
export default ReminderSchema;
