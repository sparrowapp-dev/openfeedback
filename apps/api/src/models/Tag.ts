import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITagDocument extends Document {
  _id: mongoose.Types.ObjectId;
  companyID: mongoose.Types.ObjectId;
  boardID: mongoose.Types.ObjectId;
  name: string;
  postCount: number;
  created: Date;
}

export interface ITagModel extends Model<ITagDocument> {}

const tagSchema = new Schema<ITagDocument, ITagModel>({
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
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
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
tagSchema.index({ boardID: 1, name: 1 }, { unique: true });

// Virtual for URL
tagSchema.virtual('url').get(function() {
  return `/admin/board/${this.boardID}/tag/${this._id}`;
});

// Transform output to API format
tagSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    ret.boardID = ret.boardID?.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.companyID;
    ret.created = ret.created?.toISOString();
    return ret;
  },
});

export const Tag = mongoose.model<ITagDocument, ITagModel>('Tag', tagSchema);
