import { Schema } from 'mongoose';

const ShoppingItemSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'shopping_items' },
);
export default ShoppingItemSchema;
