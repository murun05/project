import { Schema } from 'mongoose';

const MemberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true },
    timezone: { type: String, default: 'UTC' },
  },
  { timestamps: true, collection: 'members' },
);
export default MemberSchema;
