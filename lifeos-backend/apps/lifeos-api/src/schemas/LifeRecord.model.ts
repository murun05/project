import { Schema } from 'mongoose';
import { BillingCycle, DocType, RecordType } from '../libs/enums';

// One central collection: every purchase, belonging, food item, subscription, document and errand is a LifeRecord.
const LifeRecordSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    type: { type: String, enum: Object.values(RecordType), required: true },
    title: { type: String, required: true, trim: true },
    notes: String,
    archived: { type: Boolean, default: false },
    done: { type: Boolean, default: false }, // used by errands
    snoozeUntil: String, // used by errands: 'YYYY-MM-DD'
    // purchase
    merchant: String,
    purchaseDate: String,
    returnBy: String,
    warrantyEnd: String,
    // money (integer minor units + currency code) for purchases and subscriptions
    amountMinor: Number,
    currency: String,
    // belonging
    category: String,
    location: String,
    serial: String,
    // food
    qty: String,
    expires: String,
    opened: String,
    // subscription
    cycle: { type: String, enum: Object.values(BillingCycle) },
    renewal: String,
    remindDays: Number,
    trial: Boolean,
    trialEnd: String,
    unused: Boolean,
    // document
    docType: { type: String, enum: Object.values(DocType) },
    // errand
    dueDate: String,
  },
  { timestamps: true, collection: 'life_records' },
);
LifeRecordSchema.index({ memberId: 1, type: 1, archived: 1 });
export default LifeRecordSchema;
