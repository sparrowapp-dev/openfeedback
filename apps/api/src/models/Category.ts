import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategoryDocument extends Document {
  _id: mongoose.Types.ObjectId;
  companyID: mongoose.Types.ObjectId;
  boardID: mongoose.Types.ObjectId;
  createdByID?: mongoose.Types.ObjectId;
  name: string;
  postCount: number;
  created: Date;
}

export interface ICategoryModel extends Model<ICategoryDocument> {}

const categorySchema = new Schema<ICategoryDocument, ICategoryModel>({
  companyID: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  boardID: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
    index: true,
  },
  createdByID: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  postCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: name must be unique per board
categorySchema.index({ boardID: 1, name: 1 }, { unique: true });

// Virtual for URL
categorySchema.virtual('url').get(function() {
  return `/admin/board/${this.boardID}/category/${this._id}`;
});

// Transform output to API format
categorySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    ret.boardID = ret.boardID?.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.companyID;
    delete ret.createdByID;
    ret.created = ret.created?.toISOString();
    return ret;
  },
});

export const Category = mongoose.model<ICategoryDocument, ICategoryModel>('Category', categorySchema);
