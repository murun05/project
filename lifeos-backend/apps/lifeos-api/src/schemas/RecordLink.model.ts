import { Schema } from 'mongoose';
import { LinkRelation } from '../libs/enums';

const RecordLinkSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    fromId: { type: Schema.Types.ObjectId, ref: 'LifeRecord', required: true },
    toId: { type: Schema.Types.ObjectId, ref: 'LifeRecord', required: true },
    relation: { type: String, enum: Object.values(LinkRelation), required: true },
  },
  { timestamps: true, collection: 'record_links' },
);
RecordLinkSchema.index({ fromId: 1, toId: 1, relation: 1 }, { unique: true });
export default RecordLinkSchema;
